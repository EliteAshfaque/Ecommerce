import ErrorHandler from "../middlewares/errorMiddlesware.js";
import { catchAsyncErrors } from "../middlewares/catchAsynError.js";
import database from "../database/db.js";
import cloudinary from "cloudinary";
import { emitAdminChange } from "../realtime/socket.js";

export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  const totalUsersResult = await database.query(
    "SELECT COUNT(*) FROM users WHERE role = $1",
    ["User"]
  );

  const totalUsers = parseInt(totalUsersResult.rows[0].count);

  const offset = (page - 1) * 10;

  const users = await database.query(
    // Never expose password hashes or password-reset tokens to the dashboard.
    "SELECT id, name, email, role, avatar, created_at FROM users WHERE role = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
    ["User", 10, offset]
  );

  res.status(200).json({
    success: true,
    totalUsers,
    currentPage: page,
    users: users.rows,
  });
}); 
export const dashboardStats = catchAsyncErrors(async (req, res, next) => {
    const today = new Date();
    const todayDate = today.toISOString().split("T")[0];
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split("T")[0];
  
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  
    // 1. Total Revenue All Time
    const totalRevenueAllTimeQuery = await database.query(
      `SELECT SUM(o.total_price) FROM orders o
       JOIN payments p ON p.order_id = o.id
       WHERE p.payment_status = 'Paid'`
    );
    const totalRevenueAllTime = parseFloat(totalRevenueAllTimeQuery.rows[0].sum) || 0;
  
    // 2. Total Users
    const totalUsersCountQuery = await database.query(
      `SELECT COUNT(*) FROM users WHERE role = 'User'`
    );
    const totalUsersCount = parseInt(totalUsersCountQuery.rows[0].count) || 0;
  
    // 3. Order Status Counts
    const orderStatusCountsQuery = await database.query(
      `SELECT order_status, COUNT(*) FROM orders GROUP BY order_status`
    );
    const orderStatusCounts = {
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };
    orderStatusCountsQuery.rows.forEach((row) => {
      orderStatusCounts[row.order_status] = parseInt(row.count);
    });
  
    // 4. Today's Revenue
    const todayRevenueQuery = await database.query(
      `SELECT SUM(o.total_price) FROM orders o
       JOIN payments p ON p.order_id = o.id
       WHERE p.payment_status = 'Paid' AND o.created_at::date = $1`,
      [todayDate]
    );
    const todayRevenue = parseFloat(todayRevenueQuery.rows[0].sum) || 0;
  
    // 5. Yesterday's Revenue (BUG FIXED)
    const yesterdayRevenueQuery = await database.query(
      `SELECT SUM(o.total_price) FROM orders o
       JOIN payments p ON p.order_id = o.id
       WHERE p.payment_status = 'Paid' AND o.created_at::date = $1`,
      [yesterdayDate]
    );
    const yesterdayRevenue = parseFloat(yesterdayRevenueQuery.rows[0].sum) || 0;
  
    // 6. Monthly Sales For Line Chart (TYPO FIXED)
    const monthlySalesQuery = await database.query(`
      SELECT 
      -- Both orders and payments have created_at. Sales belongs to the order
      -- timeline, so qualify every date reference with the orders alias.
      TO_CHAR(o.created_at, 'Mon YYYY') AS month,
      DATE_TRUNC('month', o.created_at) AS date,
      SUM(o.total_price) AS totalSales
      FROM orders o
      JOIN payments p ON p.order_id = o.id
      WHERE p.payment_status = 'Paid'
      GROUP BY month, date
      ORDER BY date ASC
    `);
    const monthlySales = monthlySalesQuery.rows.map((row) => ({
      month: row.month,
      totalSales: parseFloat(row.totalSales) || 0,
    }));
  
    // 7. Top 5 Most Sold Products (MISMATCH FIXED)
    const topProductsQuery = await database.query(`
      SELECT p.name, 
      p.images->0->>'url' AS image,
      p.category,
      p.ratings,
      SUM(oi.quantity) AS total_sold
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      JOIN payments pay ON pay.order_id = o.id AND pay.payment_status = 'Paid'
      GROUP BY p.name, p.images, p.category, p.ratings
      ORDER BY total_sold DESC
      LIMIT 5
    `);
    const topProducts = topProductsQuery.rows.map((row) => ({
      name: row.name,
      image: row.image,
      category: row.category,
      ratings: parseFloat(row.ratings),
      totalQuantity: parseInt(row.total_sold), // Fixed to match alias
    }));
  
    // 8. Current Month Sales (TYPO FIXED)
    const currentMonthSalesQuery = await database.query(
      `SELECT SUM(o.total_price) AS total FROM orders o
       JOIN payments p ON p.order_id = o.id
       WHERE p.payment_status = 'Paid' AND o.created_at >= $1 AND o.created_at < (CURRENT_DATE + INTERVAL '1 month')`,
      [currentMonthStart]
    );
    const currentMonthSales = parseFloat(currentMonthSalesQuery.rows[0].total) || 0;
  
    // 9. Low Stock Products
    const lowStockProductsQuery = await database.query(
      `SELECT name, stock FROM products WHERE stock <= 5`
    );
    const lowStockProducts = lowStockProductsQuery.rows;
  
    // 10. Last Month Revenue
    const lastMonthRevenueQuery = await database.query(
      `SELECT SUM(o.total_price) AS total FROM orders o
       JOIN payments p ON p.order_id = o.id
       WHERE p.payment_status = 'Paid' AND o.created_at >= $1 AND o.created_at < $2`,
      [previousMonthStart, currentMonthStart]
    );
    const lastMonthRevenue = parseFloat(lastMonthRevenueQuery.rows[0].total) || 0;
  
    // 11. Revenue Growth Rate
    let revenueGrowth = "0%";
    if (lastMonthRevenue > 0) {
      const growthRate =
        ((currentMonthSales - lastMonthRevenue) / lastMonthRevenue) * 100;
      revenueGrowth = `${growthRate >= 0 ? "+" : ""}${growthRate.toFixed(2)}%`;
    }
  
    // 12. New Users This Month
    const newUsersThisMonthQuery = await database.query(
      `SELECT COUNT(*) FROM users WHERE created_at >= $1`,
      [currentMonthStart]
    );
    const newUsersThisMonth = parseInt(newUsersThisMonthQuery.rows[0].count) || 0;

    // 13. Operational dashboard data: recent fulfilment activity and sales mix are derived from paid orders.
    const [totalOrdersResult, pendingPaymentsResult, recentOrdersResult, categorySalesResult] = await Promise.all([
      database.query("SELECT COUNT(*) FROM orders"),
      database.query("SELECT COUNT(*) FROM payments WHERE payment_status = 'Pending'"),
      database.query(`SELECT o.id, o.total_price, o.order_status, o.created_at,
          u.name AS customer_name, p.payment_status, p.refund_status
        FROM orders o
        LEFT JOIN users u ON u.id = o.buyer_id
        LEFT JOIN payments p ON p.order_id = o.id
        ORDER BY o.created_at DESC LIMIT 6`),
      database.query(`SELECT p.category, SUM(oi.price * oi.quantity) AS revenue, SUM(oi.quantity)::int AS quantity
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        JOIN orders o ON o.id = oi.order_id
        JOIN payments pay ON pay.order_id = o.id AND pay.payment_status = 'Paid'
        GROUP BY p.category
        ORDER BY revenue DESC
        LIMIT 5`),
    ]);
    const totalOrders = parseInt(totalOrdersResult.rows[0].count, 10) || 0;
    const pendingPayments = parseInt(pendingPaymentsResult.rows[0].count, 10) || 0;
    const recentOrders = recentOrdersResult.rows;
    const categorySales = categorySalesResult.rows.map((row) => ({
      category: row.category,
      revenue: parseFloat(row.revenue) || 0,
      quantity: parseInt(row.quantity, 10) || 0,
    }));

    // 14. FINAL RESPONSE
    res.status(200).json({
      success: true,
      message: "Dashboard Stats Fetched Successfully",
      totalRevenueAllTime,
      todayRevenue,
      yesterdayRevenue,
      totalUsersCount,
      orderStatusCounts,
      monthlySales,
      currentMonthSales,
      topSellingProducts: topProducts,
      lowStockProducts,
      revenueGrowth,
      newUsersThisMonth,
      totalOrders,
      pendingPayments,
      recentOrders,
      categorySales,
    });
  });
export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  // Fixed variable naming conflict (renamed to deleteResult)
  const deleteResult = await database.query(
    "DELETE FROM users WHERE id = $1 RETURNING *",
    [id]
  );

  if (deleteResult.rows.length === 0) {
    return next(new ErrorHandler("User not found", 404));
  }

  const avatar = deleteResult.rows[0].avatar;

  // Delete the user's avatar from Cloudinary if it exists
  if (avatar?.public_id) {
    await cloudinary.uploader.destroy(avatar.public_id);
  }

  const { password, reset_password_token, reset_password_expire, ...safeUser } = deleteResult.rows[0];
  res.status(200).json({
    success: true,
    message: "User deleted successfully",
    user: safeUser,
  });
  emitAdminChange("users", "deleted");
});

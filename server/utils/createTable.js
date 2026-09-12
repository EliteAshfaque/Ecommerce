 import { createUserTable } from "../models/userTable.js"; // Missing in image but needed
import { createPaymentsTable } from "../models/paymentTable.js";
import { createProductReviewsTable } from "../models/productReviewTable.js";
import { createProductsTable } from "../models/productTable.js";
import { createShippingInfoTable } from "../models/shipingInfoTable.js";
import { createOrderItemTable } from "../models/ordersItemTable.js"; // Missing in image but needed
import { createOrdersTable } from "../models/ordersTable.js"; // Missing in image but needed
import database from "../database/db.js";
import { createWishlistItemsTable } from "../models/wishlistItemTable.js";
import { createPromotionsTable } from "../models/promotionTable.js";

export const createTables = async () => {
  try {
    // UUID defaults rely on pgcrypto; enabling it is safe when it already exists.
    await database.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
    // 1. Independent tables first
    await createUserTable();
    await createProductsTable();

    // 2. Tables that depend on Users/Products
    await createOrdersTable();
    await createProductReviewsTable();

    // Existing databases do not receive a new table constraint automatically.
    await database.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS reviews_product_user_unique ON reviews (product_id, user_id)"
    );

    // 3. Tables that depend on Orders
    await createOrderItemTable();
    await createPaymentsTable();
    await createShippingInfoTable();
    await createWishlistItemsTable();
    await createPromotionsTable();

    // Backward-compatible upgrades for databases created before UAE checkout.
    await database.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_price DECIMAL(10,2) NOT NULL DEFAULT 0");
    await database.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS promotion_code VARCHAR(50)");
    await database.query("ALTER TABLE shipping_info ADD COLUMN IF NOT EXISTS emirate VARCHAR(100)");
    await database.query("ALTER TABLE shipping_info ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(20)");

    console.log("All Tables Created Successfully.");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw new Error("Failed to create tables");
  }
};

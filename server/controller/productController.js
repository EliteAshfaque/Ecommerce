import ErrorHandler from "../middlewares/errorMiddlesware.js";
import { catchAsyncErrors } from "../middlewares/catchAsynError.js";
import database from "../database/db.js";
import cloudinary from "cloudinary";
import { emitCatalogueChange } from "../realtime/socket.js";

export const createProduct = catchAsyncErrors(async (req, res, next) => {
  const { name, description, price, category, stock } = req.body;

  if (!name || !description || price === undefined || !category || stock === undefined) {
    return next(new ErrorHandler("Please provide all required fields.", 400));
  }

  if (!Number.isFinite(Number(price)) || Number(price) < 0 || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
    return next(new ErrorHandler("Price must be non-negative and stock must be a whole non-negative number.", 400));
  }

  let images = [];

  if (req.files && req.files.images) {
    const files = Array.isArray(req.files.images)
      ? req.files.images
      : [req.files.images];

    for (const file of files) {
      const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
        folder: "Ecommerce_Products",
      });

      images.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }
  }

  const product = await database.query(
    `INSERT INTO products (name, description, price, category, stock, images, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      name,
      description,
      price,
      category,
      stock,
      JSON.stringify(images),
      req.user.id,
    ]
  );

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product: product.rows[0],
  });
  emitCatalogueChange("created", product.rows[0].id);
});

export const fetchAllProducts = catchAsyncErrors(async (req, res, next) => {
  const { availability, price, category, ratings, search, sort = "newest" } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
 
  const conditions = [];
  let values = [];
  let index = 1;

  let paginationPlaceholders = {};
  // Only known sort clauses are selected, keeping the query safe and predictable.
  const sortOrder = {
    newest: "p.created_at DESC",
    rating: "p.ratings DESC, p.created_at DESC",
    "price-low": "p.price ASC, p.created_at DESC",
    "price-high": "p.price DESC, p.created_at DESC",
  }[sort] || "p.created_at DESC";

  // --- Filter by Availability ---
  if (availability === "in-stock") {
    conditions.push(`stock > 5`);
  } else if (availability === "limited") {
    conditions.push(`stock > 0 AND stock <= 5`);
  } else if (availability === "out-of-stock") {
    conditions.push(`stock = 0`);
  }

  // --- Filter by Price ---
  if (price) {
    const [minPrice, maxPrice] = price.split("-");
    if (minPrice && maxPrice) {
      conditions.push(`price BETWEEN $${index} AND $${index + 1}`);
      values.push(minPrice, maxPrice);
      index += 2;
    }
  }

  // --- Filter by Category ---
  if (category) {
    conditions.push(`category ILIKE $${index}`);
    values.push(`%${category}%`);
    index++;
  }

  // --- Filter by Ratings ---
  if (ratings) {
    conditions.push(`ratings >= $${index}`);
    values.push(ratings);
    index++;
  }

  // --- Add Search Query ---
  if (search) {
    conditions.push(
      `(p.name ILIKE $${index} OR p.description ILIKE $${index})`
    );
    values.push(`%${search}%`);
    index++;
  }

  // --- Build the WHERE Clause ---
  // MISSING IN IMAGE: Build the where clause dynamically
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // --- Get Total Count of Filtered Products ---
  const totalProductsResult = await database.query(
    `SELECT COUNT(*) FROM products p ${whereClause}`,
    values
  );

  const totalProducts = parseInt(totalProductsResult.rows[0].count);

  // --- Setup Pagination Placeholders ---
  paginationPlaceholders.limit = `$${index}`;
  values.push(limit);
  index++;

  // MISSING IN IMAGE: Add offset to placeholders and push value
  paginationPlaceholders.offset = `$${index}`;
  values.push(offset);
  index++;

  // --- Fetch Products with Review Counts ---
  const query = `
    SELECT p.*, 
    COUNT(r.id) AS review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    ${whereClause}
    GROUP BY p.id
    ORDER BY ${sortOrder}
    LIMIT ${paginationPlaceholders.limit}
    OFFSET ${paginationPlaceholders.offset}
  `;

  const result = await database.query(query, values);

  // --- Query For Fetching New Products ---
  const newProductsQuery = `
    SELECT p.*, 
    COUNT(r.id) AS review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE p.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT 8
  `;

  const newProductsResult = await database.query(newProductsQuery);

  // --- Query For Fetching Top Rated Products ---
  // NOTE: This query was not fully shown in the screenshots, but is required based on the variable usage
  const topRatedQuery = `
    SELECT p.*, 
    COUNT(r.id) AS review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    GROUP BY p.id
    ORDER BY p.ratings DESC
    LIMIT 8
  `;

  const topRatedResult = await database.query(topRatedQuery);

  // --- Send Final Response ---
  res.status(200).json({
    success: true,
    products: result.rows, // The main paginated products list
    totalProducts,
    currentPage: page,
    totalPages: Math.ceil(totalProducts / limit),
    // FIXED BUG: Assigned the correct results to newProducts
    newProducts: newProductsResult.rows, 
    topRated: topRatedResult.rows,
  });
});

export const updateProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  const { name, description, price, category, stock } = req.body;

  if (!name || !description || price === undefined || !category || stock === undefined) {
    return next(
      new ErrorHandler("Please provide complete product details.", 400)
    );
  }

  if (!Number.isFinite(Number(price)) || Number(price) < 0 || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
    return next(new ErrorHandler("Price must be non-negative and stock must be a whole non-negative number.", 400));
  }

  // 1. Check if the product exists
  const product = await database.query("SELECT * FROM products WHERE id = $1", [
    productId,
  ]);

  if (product.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  let images = product.rows[0].images || [];
  if (req.files?.images) {
    const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
    const uploadedImages = [];
    for (const file of files) {
      const upload = await cloudinary.v2.uploader.upload(file.tempFilePath, {
        folder: "Ecommerce_Products",
      });
      uploadedImages.push({ public_id: upload.public_id, url: upload.secure_url });
    }
    // Delete old assets only after all replacement uploads have succeeded.
    await Promise.all(images.map((image) => cloudinary.v2.uploader.destroy(image.public_id)));
    images = uploadedImages;
  }

  // 2. Update fields and optionally replace the image collection.
  const result = await database.query(
    `UPDATE products SET name = $1, description = $2, price = $3, category = $4, stock = $5, images = $6 WHERE id = $7 RETURNING *`,
    [name, description, price, category, stock, JSON.stringify(images), productId]
  );

  // 3. Send the response (Completed the cut-off part)
  res.status(200).json({
    success: true,
    message: "Product updated successfully.",
    product: result.rows[0],
  });
  emitCatalogueChange("updated", result.rows[0].id);
});





export const deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;

  // 1. Check if the product exists in the database
  const product = await database.query("SELECT * FROM products WHERE id = $1", [
    productId,
  ]);

  if (product.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  // 2. Extract the images array before deleting the product from the database
  const images = product.rows[0].images;

  // 3. Delete the product from the database
  const deleteResult = await database.query(
    "DELETE FROM products WHERE id = $1 RETURNING *",
    [productId]
  );

  // Safety check to ensure the deletion was successful
  if (deleteResult.rows.length === 0) {
    return next(new ErrorHandler("Failed to delete product.", 500));
  }

  // 4. Delete the associated images from Cloudinary
  if (images && images.length > 0) {
    for (const image of images) {
      await cloudinary.uploader.destroy(image.public_id);
    }
  }

  // 5. Send the final response (Completed the cut-off part)
  res.status(200).json({
    success: true,
    message: "Product deleted successfully.",
  });
  emitCatalogueChange("deleted", productId);
});
export const fetchSingleProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;

  const result = await database.query(
    `
      SELECT p.*,
      COALESCE(
        json_agg(
          json_build_object(
            'review_id', r.id,
            'rating', r.rating,
            'comment', r.comment,
            'reviewer', json_build_object(
              'id', u.id,
              'name', u.name,
              'avatar', u.email
            )
          )
        ) FILTER (WHERE r.id IS NOT NULL), '[]'
      ) AS reviews
      FROM products p
      LEFT JOIN reviews r ON p.id = r.product_id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE p.id = $1
      GROUP BY p.id
    `,
    [productId]
  );

  // Completed the function: Check if product exists and send the response
  if (result.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  res.status(200).json({
    success: true,
    product: result.rows[0],
  });
});

export const postProductReview = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || !comment) {
    return next(new ErrorHandler("Please provide rating and comment.", 400));
  }

  // 1. Check if the user has actually purchased this product
  const purchaseCheckQuery = `
    SELECT oi.product_id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN payments p ON p.order_id = o.id
    WHERE o.buyer_id = $1
    AND oi.product_id = $2
    AND p.payment_status = 'Paid'
    LIMIT 1
  `;

  const { rows } = await database.query(purchaseCheckQuery, [
    req.user.id,
    productId,
  ]);

  if (rows.length === 0) {
    return res.status(403).json({
      success: false,
      message: "You can only review a product you've purchased.",
    });
  }

  // 2. Check if the product actually exists
  const product = await database.query("SELECT * FROM products WHERE id = $1", [
    productId,
  ]);

  if (product.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  // 3. Check if the user has already left a review for this product
  const isAlreadyReviewed = await database.query(
    `SELECT * FROM reviews WHERE product_id = $1 AND user_id = $2`,
    [productId, req.user.id]
  );

  let review;

  // 4. If already reviewed, UPDATE it. If not, INSERT a new one.
  if (isAlreadyReviewed.rows.length > 0) {
    review = await database.query(
      "UPDATE reviews SET rating = $1, comment = $2 WHERE product_id = $3 AND user_id = $4 RETURNING *",
      [rating, comment, productId, req.user.id]
    );
  } else {
    review = await database.query(
      "INSERT INTO reviews (rating, comment, product_id, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [rating, comment, productId, req.user.id]
    );
  }

  // 5. Calculate the new average rating for the product
  const allReviews = await database.query(
    `SELECT AVG(rating) AS avg_rating FROM reviews WHERE product_id = $1`,
    [productId]
  );

  const newAvgRating = allReviews.rows[0].avg_rating || 0;

  // 6. Update the product's overall rating in the products table
  const updatedProduct = await database.query(
    `UPDATE products SET ratings = $1 WHERE id = $2 RETURNING *`,
    [newAvgRating, productId]
  );

  // 7. Send the final success response
  res.status(200).json({
    success: true,
    message: "Review posted successfully.",
    review: review.rows[0],
    product: updatedProduct.rows[0],
  });
  emitCatalogueChange("reviewed", productId);
});

export const deleteReview = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;

  // 1. Delete the review from the database
  // Note: This only deletes the review if it belongs to the currently logged-in user (req.user.id)
  const review = await database.query(
    "DELETE FROM reviews WHERE product_id = $1 AND user_id = $2 RETURNING *",
    [productId, req.user.id]
  );

  if (review.rows.length === 0) {
    // Completed the cut-off ErrorHandler in the image
    return next(new ErrorHandler("Review not found or you are not authorized to delete it.", 404));
  }

  // 2. Recalculate the average rating for the product
  const allReviews = await database.query(
    `SELECT AVG(rating) AS avg_rating FROM reviews WHERE product_id = $1`,
    [productId]
  );

  const newAvgRating = allReviews.rows[0].avg_rating;

  // 3. Update the product's overall rating in the products table
  // Fixed: Added 'RETURNING *' to ensure updatedProduct.rows[0] works in the response
  const updatedProduct = await database.query(
    `UPDATE products SET ratings = $1 WHERE id = $2 RETURNING *`,
    [newAvgRating, productId]
  );

  // 4. Send the final response
  res.status(200).json({
    success: true,
    message: "Your review has been deleted.",
    review: review.rows[0], // The deleted review data
    product: updatedProduct.rows[0], // The product with its new calculated rating
  });
  emitCatalogueChange("review-deleted", productId);
});

export const fetchAIFilteredProducts = catchAsyncErrors(async (req, res, next) => {
  const { userPrompt } = req.body;

  if (!userPrompt) {
    return next(new ErrorHandler("Provide a valid prompt.", 400));
  }

  const filterKeywords = (query) => {
    const stopWords = new Set([
      "the", "they", "them", "then", "I", "we", "you", 
      "a", "an", "and", "or", "but", "is", "are", "was", "were",
      "to", "for", "with", "in", "on", "at", "by", "this", "that"
    ]);

    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => !stopWords.has(word))
      .map((word) => `%${word}%`);
  };

  const keywords = filterKeywords(userPrompt);

  // STEP 1: Basic SQL Filtering
  const result = await database.query(
    `
      SELECT * FROM products
      WHERE name ILIKE ANY($1)
      OR description ILIKE ANY($1)
      OR category ILIKE ANY($1)
      LIMIT 200;
    `,
    [keywords]
  );

  const filteredProducts = result.rows;

  if (filteredProducts.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No products found matching your prompt.",
      products: [],
    });
  }

  // STEP 2: AI FILTERING
  const { success, products } = await getAIRecommendation(
    req,
    res,
    userPrompt,
    filteredProducts
  );

  res.status(200).json({
    success: success,
    message: "AI filtered products.",
    products,
  });
});

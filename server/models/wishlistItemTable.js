import database from "../database/db.js";

// A single row represents one customer saving one product for later.
export async function createWishlistItemsTable() {
  await database.query(`
    CREATE TABLE IF NOT EXISTS wishlist_items (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, product_id)
    );
  `);
}

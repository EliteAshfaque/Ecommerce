import database from "../database/db.js";

// Promotions are code-based campaigns managed by the admin dashboard.
export async function createPromotionsTable() {
  await database.query(`
    CREATE TABLE IF NOT EXISTS promotions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      description TEXT,
      discount_type VARCHAR(10) NOT NULL CHECK (discount_type IN ('Percent', 'Fixed')),
      discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
      min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
      max_discount_amount DECIMAL(10,2) CHECK (max_discount_amount IS NULL OR max_discount_amount >= 0),
      starts_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ends_at TIMESTAMP,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CHECK (ends_at IS NULL OR ends_at > starts_at)
    );
  `);
}

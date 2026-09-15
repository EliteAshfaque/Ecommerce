import database from "../database/db.js";

// A return is deliberately separate from an order: one order can have several
// requests over time, while each request owns the exact line-item quantities.
export async function createReturnsTables() {
  await database.query(`
    CREATE TABLE IF NOT EXISTS return_requests (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'Requested'
        CHECK (status IN ('Requested', 'Approved', 'Rejected', 'Received', 'Refunded', 'Cancelled')),
      reason VARCHAR(80) NOT NULL,
      customer_note TEXT,
      admin_note TEXT,
      requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await database.query(`
    CREATE TABLE IF NOT EXISTS return_items (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      return_request_id UUID NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
      order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      quantity INT NOT NULL CHECK (quantity > 0),
      UNIQUE(return_request_id, order_item_id)
    );
  `);
  await database.query("CREATE INDEX IF NOT EXISTS return_requests_buyer_idx ON return_requests (buyer_id, requested_at DESC)");
  await database.query("CREATE INDEX IF NOT EXISTS return_requests_status_idx ON return_requests (status, requested_at DESC)");
}

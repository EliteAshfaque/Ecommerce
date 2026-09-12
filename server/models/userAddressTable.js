import database from "../database/db.js";

export async function createUserAddressesTable() {
  await database.query(`CREATE TABLE IF NOT EXISTS user_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(30) NOT NULL DEFAULT 'Home',
    recipient_name VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    emirate VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'United Arab Emirates',
    pincode VARCHAR(30) NOT NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  // Each account can have one default destination while retaining Home, Office and other addresses.
  await database.query("CREATE UNIQUE INDEX IF NOT EXISTS user_addresses_one_default ON user_addresses (user_id) WHERE is_default = TRUE");
}

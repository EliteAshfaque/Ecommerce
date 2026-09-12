import database from "../database/db.js";

// Content managed by the storefront is separate from transactional product/order data.
export async function createStorefrontTables() {
  await database.query(`
    CREATE TABLE IF NOT EXISTS storefront_categories (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      slug VARCHAR(120) NOT NULL UNIQUE,
      description TEXT,
      image_url TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await database.query(`
    CREATE TABLE IF NOT EXISTS storefront_banners (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      eyebrow VARCHAR(160),
      title VARCHAR(180) NOT NULL,
      description TEXT,
      image_url TEXT NOT NULL,
      cta_label VARCHAR(80) NOT NULL,
      cta_url VARCHAR(255) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      starts_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ends_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await database.query(`
    CREATE TABLE IF NOT EXISTS storefront_offers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      kicker VARCHAR(80),
      title VARCHAR(180) NOT NULL,
      description TEXT,
      promotion_code VARCHAR(50),
      cta_label VARCHAR(80) NOT NULL DEFAULT 'Shop offer',
      cta_url VARCHAR(255) NOT NULL DEFAULT '/products',
      accent VARCHAR(30) NOT NULL DEFAULT 'violet',
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await database.query(`
    CREATE TABLE IF NOT EXISTS storefront_news (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      kicker VARCHAR(80),
      title VARCHAR(180) NOT NULL,
      description TEXT,
      image_url TEXT,
      cta_label VARCHAR(80) NOT NULL DEFAULT 'Discover',
      cta_url VARCHAR(255) NOT NULL DEFAULT '/products',
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await database.query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      subject VARCHAR(180),
      message TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'New',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await database.query(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email VARCHAR(100) NOT NULL UNIQUE,
      subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

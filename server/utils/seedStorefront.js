import "../config/loadEnv.js";
import database from "../database/db.js";
import { createTables } from "./createTable.js";

const categories = [
  ["Electronics", "electronics", "Tech that earns its place in your day.", "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=80", 1],
  ["Fashion", "fashion", "New-season layers and lasting accessories.", "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80", 2],
  ["Home & Garden", "home-garden", "Objects that make a room feel finished.", "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80", 3],
  ["Sports", "sports", "Move with more intention.", "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80", 4],
  ["Beauty", "beauty", "Quiet rituals, radiant results.", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80", 5],
  ["Kitchen", "kitchen", "A better table starts here.", "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80", 6],
  ["Accessories", "accessories", "Small details with lasting impact.", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80", 7],
  ["Books", "books", "Ideas worth keeping close.", "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80", 8],
];

const banners = [
  ["The UAE edit · 2026", "Make the everyday feel considered.", "A curated market of useful objects, rare details and new-season finds — delivered across the Emirates.", "/images/lumera-hero-editorial-v1.png", "Explore the edit", "/products", 1],
  ["New season · Fashion", "Soft structure. Strong point of view.", "Layers, leather and the finishing pieces that take you from work to weekend.", "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=2000&q=80", "Shop fashion", "/products?category=Fashion", 2],
  ["Home stories · LUMERA", "Objects with a sense of place.", "Design-led furniture, warm light and beautiful table pieces for the rooms you return to.", "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2000&q=80", "Shop home", "/products?category=Home%20%26%20Garden", 3],
];

const offers = [
  ["A new welcome", "10% off your first considered find", "Use WELCOME10 at checkout on orders over AED 150.", "WELCOME10", "Shop the welcome edit", "/products", "violet", 1],
  ["Home, delivered", "Complimentary standard delivery over AED 250", "Choose your Emirate at checkout. Dubai and every Emirate are covered.", null, "Explore home", "/products?category=Home%20%26%20Garden", "sand", 2],
  ["Members' edit", "Save the pieces you want to keep close", "Heart any find to build a private, always-synced LUMERA collection.", null, "View favourites", "/favourites", "rose", 3],
];

const news = [
  ["Journal · New in", "The objects that make a slower morning", "Stoneware, quiet lighting and the simple tools that make daily rituals feel better.", "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80", "Explore kitchen", "/products?category=Kitchen", 1],
  ["UAE delivery", "Your LUMERA order, across the Emirates", "Select Standard or Express delivery at checkout, with transparent AED pricing before you pay.", "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80", "Start shopping", "/products", 2],
  ["The private edit", "Save now. Decide beautifully later.", "Your favourites are private to your account and ready whenever you are.", "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80", "Open favourites", "/favourites", 3],
];

async function seedStorefront() {
  try {
    await createTables();
    for (const [name, slug, description, imageUrl, sortOrder] of categories) {
      await database.query(`INSERT INTO storefront_categories (name, slug, description, image_url, sort_order)
        VALUES ($1,$2,$3,$4,$5) ON CONFLICT (name) DO UPDATE SET slug=EXCLUDED.slug, description=EXCLUDED.description, image_url=EXCLUDED.image_url, sort_order=EXCLUDED.sort_order`, [name, slug, description, imageUrl, sortOrder]);
    }
    for (const [eyebrow, title, description, imageUrl, ctaLabel, ctaUrl, sortOrder] of banners) {
      await database.query(`INSERT INTO storefront_banners (eyebrow,title,description,image_url,cta_label,cta_url,sort_order)
        SELECT $1::varchar,$2::varchar,$3::text,$4::text,$5::varchar,$6::varchar,$7::int WHERE NOT EXISTS (SELECT 1 FROM storefront_banners WHERE title=$2::varchar)`, [eyebrow, title, description, imageUrl, ctaLabel, ctaUrl, sortOrder]);
    }
    for (const [kicker, title, description, code, ctaLabel, ctaUrl, accent, sortOrder] of offers) {
      await database.query(`INSERT INTO storefront_offers (kicker,title,description,promotion_code,cta_label,cta_url,accent,sort_order)
        SELECT $1::varchar,$2::varchar,$3::text,$4::varchar,$5::varchar,$6::varchar,$7::varchar,$8::int WHERE NOT EXISTS (SELECT 1 FROM storefront_offers WHERE title=$2::varchar)`, [kicker, title, description, code, ctaLabel, ctaUrl, accent, sortOrder]);
    }
    for (const [kicker, title, description, imageUrl, ctaLabel, ctaUrl, sortOrder] of news) {
      await database.query(`INSERT INTO storefront_news (kicker,title,description,image_url,cta_label,cta_url,sort_order)
        SELECT $1::varchar,$2::varchar,$3::text,$4::text,$5::varchar,$6::varchar,$7::int WHERE NOT EXISTS (SELECT 1 FROM storefront_news WHERE title=$2::varchar)`, [kicker, title, description, imageUrl, ctaLabel, ctaUrl, sortOrder]);
    }
    await database.query(`INSERT INTO promotions (code,name,description,discount_type,discount_value,min_order_amount,is_active)
      VALUES ('WELCOME10','Welcome to LUMERA','10% off your first order over AED 150','Percent',10,150,TRUE)
      ON CONFLICT (code) DO UPDATE SET is_active=TRUE, discount_value=10, min_order_amount=150`);
    console.log("Storefront categories, banners, offers, news and WELCOME10 are ready.");
  } finally {
    await database.end();
  }
}

seedStorefront().catch((error) => { console.error("Storefront seed failed:", error.message); process.exitCode = 1; });

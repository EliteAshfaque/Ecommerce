import "../config/loadEnv.js";
import bcrypt from "bcrypt";
import { pathToFileURL } from "node:url";
import database from "../database/db.js";

const sourceUrl =
  "https://dummyjson.com/products?limit=0&select=id,title,description,price,discountPercentage,rating,stock,category,thumbnail,images,brand";

const titleCase = (value) =>
  value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const getAdminId = async () => {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before seeding.");
  }

  const existing = await database.query("SELECT id FROM users WHERE email=$1", [email]);
  if (existing.rows[0]) {
    await database.query("UPDATE users SET role='Admin' WHERE id=$1", [existing.rows[0].id]);
    return existing.rows[0].id;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await database.query(
    "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'Admin') RETURNING id",
    ["Ashfaque Ansari", email, passwordHash]
  );
  return rows[0].id;
};

const insertOnce = async (table, columns, values, title) => {
  const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
  await database.query(
    `INSERT INTO ${table} (${columns.join(", ")})
     SELECT ${placeholders}
     WHERE NOT EXISTS (SELECT 1 FROM ${table} WHERE title = $${values.length + 1})`,
    [...values, title]
  );
};

export const seedStorefrontContent = async () => {
  const banners = [
    {
      eyebrow: "New season edit",
      title: "Fresh essentials for every day",
      description: "Discover smart accessories, home upgrades, and daily favourites selected for modern living.",
      imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1800&q=85",
      ctaLabel: "Shop new arrivals",
      ctaUrl: "/products?sort=newest",
    },
    {
      eyebrow: "Tech picks",
      title: "Upgrade the way you work and play",
      description: "Explore laptops, mobile accessories, tablets, and audio-ready essentials in one place.",
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1800&q=85",
      ctaLabel: "Explore technology",
      ctaUrl: "/products?category=Smartphones",
    },
    {
      eyebrow: "Home refresh",
      title: "Small details. A better home.",
      description: "Bring personality to your space with practical kitchen, décor, and furniture picks.",
      imageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1800&q=85",
      ctaLabel: "Shop home",
      ctaUrl: "/products?category=Home%20Decoration",
    },
  ];

  const offers = [
    { kicker: "Limited-time value", title: "Save on everyday favourites", description: "Browse sale-tagged products across beauty, kitchen, technology, and more.", code: null, accent: "violet", ctaUrl: "/products?sort=price-low" },
    { kicker: "Smart tech", title: "Power up your setup", description: "Find practical accessories and devices for work, play, and everything between.", code: null, accent: "blue", ctaUrl: "/products?category=Mobile%20Accessories" },
    { kicker: "Style refresh", title: "Your new wardrobe starts here", description: "Easy-to-wear fashion, watches, bags, jewellery, and seasonal pieces.", code: null, accent: "amber", ctaUrl: "/products?category=Womens%20Dresses" },
    { kicker: "Home favourites", title: "Make every room more yours", description: "Practical kitchen tools and home accents for the everyday routine.", code: null, accent: "emerald", ctaUrl: "/products?category=Kitchen%20Accessories" },
  ];

  const news = [
    { kicker: "Shopping guide", title: "The everyday tech checklist", description: "Simple picks to keep work, travel, and downtime running smoothly.", imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85", ctaUrl: "/products?category=Laptops" },
    { kicker: "Home edit", title: "Easy upgrades for your kitchen", description: "Useful tools and thoughtful touches for more enjoyable daily cooking.", imageUrl: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=85", ctaUrl: "/products?category=Kitchen%20Accessories" },
    { kicker: "Style notes", title: "Accessories that finish the look", description: "Discover watches, sunglasses, bags, and jewellery for every plan.", imageUrl: "https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=1200&q=85", ctaUrl: "/products?category=Womens%20Jewellery" },
  ];

  for (const [index, banner] of banners.entries()) {
    await insertOnce(
      "storefront_banners",
      ["eyebrow", "title", "description", "image_url", "cta_label", "cta_url", "sort_order", "is_active"],
      [banner.eyebrow, banner.title, banner.description, banner.imageUrl, banner.ctaLabel, banner.ctaUrl, index + 1, true],
      banner.title
    );
  }
  for (const [index, offer] of offers.entries()) {
    await insertOnce(
      "storefront_offers",
      ["kicker", "title", "description", "promotion_code", "cta_label", "cta_url", "accent", "sort_order", "is_active"],
      [offer.kicker, offer.title, offer.description, offer.code, "Shop now", offer.ctaUrl, offer.accent, index + 1, true],
      offer.title
    );
  }
  for (const [index, article] of news.entries()) {
    await insertOnce(
      "storefront_news",
      ["kicker", "title", "description", "image_url", "cta_label", "cta_url", "sort_order", "is_active"],
      [article.kicker, article.title, article.description, article.imageUrl, "Discover", article.ctaUrl, index + 1, true],
      article.title
    );
  }
};

export const seedCatalog = async () => {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`Product source request failed: ${response.status}`);
  const { products } = await response.json();
  const adminId = await getAdminId();

  const categories = new Map();
  for (const product of products) {
    const category = titleCase(product.category);
    categories.set(product.category, {
      name: category,
      slug: slugify(category),
      description: `Shop ${category.toLowerCase()} essentials selected for every day.`,
      imageUrl: product.thumbnail,
    });
  }

  await database.query("BEGIN");
  try {
    for (const category of categories.values()) {
      await database.query(
        `INSERT INTO storefront_categories (name, slug, description, image_url, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (slug) DO UPDATE SET
           name=EXCLUDED.name, description=EXCLUDED.description, image_url=EXCLUDED.image_url, is_active=true`,
        [category.name, category.slug, category.description, category.imageUrl, [...categories.values()].indexOf(category) + 1]
      );
    }

    const productRows = products.map((product) => {
      const sourceKey = `dummyjson-${product.id}`;
      const images = [...new Set([product.thumbnail, ...(product.images || [])])]
        .filter(Boolean)
        .slice(0, 4)
        .map((url) => ({ url, public_id: sourceKey }));
      const price = Number(product.price);
      const discount = Number(product.discountPercentage || 0);
      const compareAtPrice = discount > 0 ? Number((price / (1 - discount / 100)).toFixed(2)) : null;
      const sourceMarker = `[Catalogue source: DummyJSON #${product.id}]`;
      return [
        product.title,
        `${product.description}${product.brand ? ` Brand: ${product.brand}.` : ""} ${sourceMarker}`,
        price,
        compareAtPrice,
        discount >= 15 ? "Sale" : "New",
        titleCase(product.category),
        Math.min(5, Number(product.rating || 0)),
        JSON.stringify(images),
        Math.max(0, Math.trunc(Number(product.stock || 0))),
        adminId,
        `%${sourceMarker}%`,
      ];
    });
    const productValues = productRows.flat();
    const productPlaceholders = productRows
      .map((_, row) => {
        const index = row * 11;
        return `($${index + 1}, $${index + 2}, $${index + 3}::numeric, $${index + 4}::numeric, $${index + 5}, $${index + 6}, $${index + 7}::numeric, $${index + 8}::jsonb, $${index + 9}::int, $${index + 10}::uuid, $${index + 11})`;
      })
      .join(", ");
    await database.query(
      `WITH seed (name, description, price, compare_at_price, badge, category, ratings, images, stock, created_by, source_marker) AS (
        VALUES ${productPlaceholders}
      )
      INSERT INTO products (name, description, price, compare_at_price, badge, category, ratings, images, stock, created_by)
      SELECT name, description, price, compare_at_price, badge, category, ratings, images, stock, created_by
      FROM seed
      WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.description LIKE seed.source_marker)`,
      productValues
    );
    await seedStorefrontContent();
    await database.query("COMMIT");
    console.log(`Seeded ${products.length} products across ${categories.size} categories.`);
  } catch (error) {
    await database.query("ROLLBACK");
    throw error;
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedCatalog()
    .catch((error) => {
      console.error("Catalogue seeding failed:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await database.end();
    });
}

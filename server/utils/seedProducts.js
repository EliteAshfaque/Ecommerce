import "../config/loadEnv.js";
import database from "../database/db.js";

const ADMIN_EMAIL = "ashfaque@gmail.com";

const products = [
  // Electronics
  {
    name: "Aura Wireless Headphones",
    description:
      "Soft leather cushions, adaptive noise control, and a 40-hour battery for long, quiet listening sessions.",
    price: 289.0,
    category: "Electronics",
    ratings: 4.8,
    stock: 28,
    images: [
      {
        public_id: "seed/aura-headphones",
        url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    name: "Lumen Smart Watch",
    description:
      "A brushed steel smartwatch with health insights, always-on display, and a minimalist face for every day.",
    price: 349.0,
    category: "Electronics",
    ratings: 4.6,
    stock: 35,
    images: [
      {
        public_id: "seed/lumen-watch",
        url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    name: "Nordic Bluetooth Speaker",
    description:
      "Room-filling sound in a compact oak-and-aluminum shell. Water-resistant and made for evenings in.",
    price: 179.0,
    category: "Electronics",
    ratings: 4.5,
    stock: 42,
    images: [
      {
        public_id: "seed/nordic-speaker",
        url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    name: "Clarity DSLR Lens Kit",
    description:
      "A versatile prime lens set with soft bokeh and crisp detail — built for studio and travel photography.",
    price: 520.0,
    category: "Electronics",
    ratings: 4.9,
    stock: 12,
    images: [
      {
        public_id: "seed/clarity-lens",
        url: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },

  // Fashion
  {
    name: "Merino Oversized Coat",
    description:
      "A structured wool coat with clean lines and a soft merino blend. Layer it for city winters.",
    price: 410.0,
    category: "Fashion",
    ratings: 4.7,
    stock: 18,
    images: [
      {
        public_id: "seed/merino-coat",
        url: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    name: "Silk Everyday Shirt",
    description:
      "Breathable silk with a relaxed collar and matte finish. Effortless from desk to dinner.",
    price: 165.0,
    category: "Fashion",
    ratings: 4.4,
    stock: 40,
    images: [
      {
        public_id: "seed/silk-shirt",
        url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    name: "Leather Weekend Bag",
    description:
      "Full-grain leather weekender with brass hardware and a lined interior for two-day escapes.",
    price: 295.0,
    category: "Fashion",
    ratings: 4.8,
    stock: 22,
    images: [
      {
        public_id: "seed/leather-bag",
        url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    name: "Sculpted Leather Boots",
    description:
      "Hand-finished boots with a slim silhouette and cushioned sole — made to walk the long way home.",
    price: 320.0,
    category: "Fashion",
    ratings: 4.6,
    stock: 16,
    images: [
      {
        public_id: "seed/leather-boots",
        url: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },

  // Home & Garden
  {
    name: "Arc Ceramic Table Lamp",
    description:
      "Warm ceramic base with linen shade. Soft ambient light for bedside reading and late nights.",
    price: 148.0,
    category: "Home & Garden",
    ratings: 4.7,
    stock: 30,
    images: [
      {
        public_id: "seed/arc-lamp",
        url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    name: "Oak Lounge Chair",
    description:
      "Solid oak frame with bouclé upholstery. A quiet statement piece for living rooms and studios.",
    price: 680.0,
    category: "Home & Garden",
    ratings: 4.9,
    stock: 8,
    images: [
      {
        public_id: "seed/oak-chair",
        url: "https://images.unsplash.com/photo-1567538096630-e0c55ce644e8?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    name: "Linen Throw Set",
    description:
      "Stone-washed linen throws in muted tones. Softens any sofa and gets better with every wash.",
    price: 98.0,
    category: "Home & Garden",
    ratings: 4.5,
    stock: 55,
    images: [
      {
        public_id: "seed/linen-throw",
        url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    name: "Terracotta Planter Duo",
    description:
      "Hand-thrown terracotta planters with drainage trays. Perfect for herbs and trailing greens.",
    price: 72.0,
    category: "Home & Garden",
    ratings: 4.3,
    stock: 60,
    images: [
      {
        public_id: "seed/terracotta-planter",
        url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },

  // Sports
  {
    name: "Carbon Road Bike",
    description:
      "Lightweight carbon frame with responsive handling. Built for early rides and weekend climbs.",
    price: 1890.0,
    category: "Sports",
    ratings: 4.8,
    stock: 6,
    images: [
      {
        public_id: "seed/carbon-bike",
        url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    name: "Studio Yoga Mat",
    description:
      "Extra-grip natural rubber mat with a calm earth tone. Dense cushioning without the bulk.",
    price: 78.0,
    category: "Sports",
    ratings: 4.6,
    stock: 70,
    images: [
      {
        public_id: "seed/yoga-mat",
        url: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    name: "Trail Running Shoes",
    description:
      "Breathable mesh uppers and rock-plate protection for uneven paths. Light, grippy, ready.",
    price: 155.0,
    category: "Sports",
    ratings: 4.5,
    stock: 38,
    images: [
      {
        public_id: "seed/trail-shoes",
        url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    name: "Insulated Water Bottle",
    description:
      "Double-wall stainless steel that keeps drinks cold for 24 hours. Matte finish, no condensation.",
    price: 42.0,
    category: "Sports",
    ratings: 4.4,
    stock: 90,
    images: [
      {
        public_id: "seed/water-bottle",
        url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
];

async function seedProducts() {
  try {
    const adminResult = await database.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [ADMIN_EMAIL]
    );

    if (adminResult.rows.length === 0) {
      throw new Error(`Admin user not found: ${ADMIN_EMAIL}`);
    }

    const createdBy = adminResult.rows[0].id;
    let inserted = 0;

    for (const product of products) {
      const existing = await database.query(
        "SELECT id FROM products WHERE name = $1 LIMIT 1",
        [product.name]
      );

      if (existing.rows.length > 0) {
        console.log(`Skipped (exists): ${product.name}`);
        continue;
      }

      await database.query(
        `INSERT INTO products
          (name, description, price, category, ratings, images, stock, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          product.name,
          product.description,
          product.price,
          product.category,
          product.ratings,
          JSON.stringify(product.images),
          product.stock,
          createdBy,
        ]
      );

      inserted += 1;
      console.log(`Inserted: ${product.name} (${product.category})`);
    }

    const count = await database.query("SELECT COUNT(*) FROM products");
    console.log(`\nDone. Inserted ${inserted} products. Total now: ${count.rows[0].count}`);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await database.end();
  }
}

seedProducts();

import "../config/loadEnv.js";
import database from "../database/db.js";

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

  // Beauty
  {
    name: "Saffron Glow Face Oil",
    description: "A lightweight botanical face oil with saffron, squalane and rosehip for a soft, luminous finish.",
    price: 118.0,
    category: "Beauty",
    ratings: 4.7,
    stock: 46,
    images: [{ public_id: "seed/saffron-face-oil", url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Velvet Lip Colour Set",
    description: "Four modern neutral shades in a comfortable velvet-matte formula for an effortless day-to-night edit.",
    price: 96.0,
    category: "Beauty",
    ratings: 4.5,
    stock: 62,
    images: [{ public_id: "seed/velvet-lips", url: "https://images.unsplash.com/photo-1583241800698-e8ab01830a3c?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Neroli Candle No. 02",
    description: "Hand-poured soy wax with neroli, cedarwood and warm amber. A calm scent for evenings in.",
    price: 84.0,
    category: "Beauty",
    ratings: 4.8,
    stock: 38,
    images: [{ public_id: "seed/neroli-candle", url: "https://images.unsplash.com/photo-1602874801006-e26c1d68f7a7?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Rose Quartz Beauty Tool",
    description: "A cooling, hand-polished facial tool designed for a simple, restorative skincare ritual.",
    price: 54.0,
    category: "Beauty",
    ratings: 4.4,
    stock: 74,
    images: [{ public_id: "seed/rose-quartz", url: "https://images.unsplash.com/photo-1619451334792-150fd785ee74?auto=format&fit=crop&w=1200&q=80" }],
  },

  // Kitchen
  {
    name: "Stoneware Espresso Set",
    description: "Four tactile stoneware espresso cups with saucers, glazed in a soft sand tone.",
    price: 128.0,
    category: "Kitchen",
    ratings: 4.8,
    stock: 34,
    images: [{ public_id: "seed/stoneware-espresso", url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Walnut Serving Board",
    description: "A solid walnut board with softly rounded edges for fruit, cheese and relaxed table settings.",
    price: 112.0,
    category: "Kitchen",
    ratings: 4.6,
    stock: 29,
    images: [{ public_id: "seed/walnut-board", url: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Precision Pour Kettle",
    description: "A matte-black gooseneck kettle with a balanced handle for a more precise morning pour-over.",
    price: 159.0,
    category: "Kitchen",
    ratings: 4.7,
    stock: 24,
    images: [{ public_id: "seed/pour-kettle", url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Olive Linen Apron",
    description: "Washed linen apron with adjustable straps and generous front pockets for slow weekend cooking.",
    price: 78.0,
    category: "Kitchen",
    ratings: 4.3,
    stock: 53,
    images: [{ public_id: "seed/linen-apron", url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80" }],
  },

  // Accessories
  {
    name: "Orbit Stainless Watch",
    description: "A refined stainless-steel watch with a sunray dial and interchangeable charcoal strap.",
    price: 468.0,
    category: "Accessories",
    ratings: 4.7,
    stock: 17,
    images: [{ public_id: "seed/orbit-watch", url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Tortoise Sun Frames",
    description: "Lightweight acetate frames with warm tortoise patterning and UV-protective lenses.",
    price: 142.0,
    category: "Accessories",
    ratings: 4.5,
    stock: 49,
    images: [{ public_id: "seed/tortoise-frames", url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Pearl Drop Earrings",
    description: "Modern freshwater pearl drops in a delicate gold-tone setting, made for everyday polish.",
    price: 134.0,
    category: "Accessories",
    ratings: 4.6,
    stock: 41,
    images: [{ public_id: "seed/pearl-earrings", url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Cashmere Travel Wrap",
    description: "A feather-light cashmere wrap with a generous drape for flights, cool evenings and long drives.",
    price: 248.0,
    category: "Accessories",
    ratings: 4.8,
    stock: 20,
    images: [{ public_id: "seed/cashmere-wrap", url: "https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=1200&q=80" }],
  },

  // Books
  {
    name: "The Design of Living",
    description: "A visually rich guide to shaping warm, functional rooms with texture, light and everyday objects.",
    price: 128.0,
    category: "Books",
    ratings: 4.9,
    stock: 27,
    images: [{ public_id: "seed/design-living", url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Gulf Table: Modern Recipes",
    description: "Seasonal recipes and stories inspired by the generous tables, spices and coastlines of the Gulf.",
    price: 112.0,
    category: "Books",
    ratings: 4.8,
    stock: 33,
    images: [{ public_id: "seed/gulf-table", url: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Atlas of Quiet Places",
    description: "A travel volume celebrating remote hotels, considered architecture and restorative landscapes.",
    price: 146.0,
    category: "Books",
    ratings: 4.6,
    stock: 31,
    images: [{ public_id: "seed/quiet-places", url: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Notes on Good Objects",
    description: "An illustrated pocket book on materials, repair and choosing fewer things with more intention.",
    price: 68.0,
    category: "Books",
    ratings: 4.4,
    stock: 65,
    images: [{ public_id: "seed/good-objects", url: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80" }],
  },

  // Extra marketplace depth for categories that previously had only four starter products.
  {
    name: "Halo Compact Projector",
    description: "A portable full-HD projector with auto-focus, built-in streaming and a quiet cinema mode for intimate movie nights.",
    price: 699.0,
    category: "Electronics",
    ratings: 4.6,
    stock: 15,
    images: [{ public_id: "seed/halo-projector", url: "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Arc Magnetic Charging Stand",
    description: "A weighted aluminium charging stand that keeps compatible phones visible and powered at the desk.",
    price: 129.0,
    category: "Electronics",
    ratings: 4.5,
    stock: 57,
    images: [{ public_id: "seed/arc-charger", url: "https://images.unsplash.com/photo-1587033411391-5d9e51cce126?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Linen Tailored Trousers",
    description: "Breathable wide-leg linen trousers with an adjustable waist and clean front pleats for warm UAE days.",
    price: 189.0,
    category: "Fashion",
    ratings: 4.6,
    stock: 36,
    images: [{ public_id: "seed/linen-trousers", url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Sculptural Loop Belt",
    description: "A smooth leather belt finished with a brushed metal loop buckle, made to sharpen simple outfits.",
    price: 98.0,
    category: "Fashion",
    ratings: 4.4,
    stock: 48,
    images: [{ public_id: "seed/loop-belt", url: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Mosaic Travertine Side Table",
    description: "A softly veined side table with a sculptural round top, designed to anchor a reading corner or bedside.",
    price: 520.0,
    category: "Home & Garden",
    ratings: 4.8,
    stock: 11,
    images: [{ public_id: "seed/travertine-table", url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Smoked Glass Vase Pair",
    description: "Two hand-finished smoked glass vases with organic silhouettes for stems, branches or a quiet shelf moment.",
    price: 136.0,
    category: "Home & Garden",
    ratings: 4.7,
    stock: 25,
    images: [{ public_id: "seed/smoked-vases", url: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Recovery Foam Roller",
    description: "A high-density textured foam roller for post-training recovery, mobility work and a calmer cooldown.",
    price: 74.0,
    category: "Sports",
    ratings: 4.5,
    stock: 63,
    images: [{ public_id: "seed/recovery-roller", url: "https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    name: "Foldable Studio Exercise Mat",
    description: "A supportive non-slip training mat that folds neatly into a compact carry format for home or travel.",
    price: 118.0,
    category: "Sports",
    ratings: 4.6,
    stock: 44,
    images: [{ public_id: "seed/foldable-mat", url: "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=1200&q=80" }],
  },
];

async function seedProducts() {
  try {
    // Seed against the first real admin, avoiding a hard-coded local email.
    const adminResult = await database.query(
      "SELECT id FROM users WHERE role = 'Admin' ORDER BY created_at ASC LIMIT 1"
    );

    if (adminResult.rows.length === 0) {
      throw new Error("Create an Admin account before seeding the catalogue.");
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

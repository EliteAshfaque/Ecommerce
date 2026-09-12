import database from "../database/db.js";
import { catchAsyncErrors } from "../middlewares/catchAsynError.js";
import ErrorHandler from "../middlewares/errorMiddlesware.js";

// One public payload keeps homepage, category navigation, and discovery in sync.
export const getStorefront = catchAsyncErrors(async (_req, res) => {
  const [categories, banners, offers, news] = await Promise.all([
    database.query(`SELECT c.*, COUNT(p.id)::int AS product_count FROM storefront_categories c
      LEFT JOIN products p ON p.category = c.name
      WHERE c.is_active = TRUE GROUP BY c.id ORDER BY c.sort_order, c.name`),
    database.query(`SELECT * FROM storefront_banners WHERE is_active = TRUE
      AND starts_at <= CURRENT_TIMESTAMP AND (ends_at IS NULL OR ends_at > CURRENT_TIMESTAMP)
      ORDER BY sort_order, created_at DESC`),
    database.query("SELECT * FROM storefront_offers WHERE is_active = TRUE ORDER BY sort_order, created_at DESC"),
    database.query("SELECT * FROM storefront_news WHERE is_active = TRUE AND published_at <= CURRENT_TIMESTAMP ORDER BY sort_order, published_at DESC LIMIT 3"),
  ]);
  res.status(200).json({ success: true, categories: categories.rows, banners: banners.rows, offers: offers.rows, news: news.rows });
});

export const createContactMessage = catchAsyncErrors(async (req, res, next) => {
  const { name, email, subject = "", message } = req.body;
  if (!name?.trim() || !email?.trim() || !message?.trim()) return next(new ErrorHandler("Name, email and message are required.", 400));
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return next(new ErrorHandler("Enter a valid email address.", 400));
  await database.query("INSERT INTO contact_messages (name,email,subject,message) VALUES ($1,$2,$3,$4)", [name.trim(), email.trim().toLowerCase(), subject.trim(), message.trim()]);
  res.status(201).json({ success: true, message: "Message received. Our team will reply within one business day." });
});

export const subscribeNewsletter = catchAsyncErrors(async (req, res, next) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return next(new ErrorHandler("Enter a valid email address.", 400));
  await database.query("INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING", [email]);
  res.status(201).json({ success: true, message: "You are on the LUMERA list." });
});

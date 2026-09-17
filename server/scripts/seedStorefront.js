import "../config/loadEnv.js";
import database from "../database/db.js";
import { seedStorefrontContent } from "./seedCatalog.js";

try {
  await database.query("BEGIN");
  await seedStorefrontContent();
  await database.query("COMMIT");
  console.log("Storefront banners, offers, and news seeded successfully.");
} catch (error) {
  await database.query("ROLLBACK");
  console.error("Storefront seeding failed:", error);
  process.exitCode = 1;
} finally {
  await database.end();
}

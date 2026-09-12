import pkg from "pg";
const { Pool } = pkg;

// A pool lets simultaneous storefront, dashboard, webhook, and Socket.IO work
// use independent database connections instead of queueing behind one client.
const database = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

 try {
    await database.query("SELECT 1");
    console.log("Connected to the database successfully");
 } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }

export default database;

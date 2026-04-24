import mysql from "mysql2/promise";
import { readFileSync } from "fs";

const DATABASE_URL = "mysql://3Mjeh6XrLmdNXfQ.root:emMGHoXf8XSdXDq3zClifCeP0OgnH8EJ@ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com:4000/19dbffd3-ae22-8d1d-8000-091306c888bb";

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);

  // Read and execute migration
  const sql = readFileSync("./db/migrations/0000_tidy_james_howlett.sql", "utf-8");
  const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith("-->"));

  for (const stmt of statements) {
    try {
      await conn.execute(stmt + ";");
      console.log("Executed:", stmt.slice(0, 50) + "...");
    } catch (e: any) {
      if (e.message.includes("already exists")) {
        console.log("Skipping (already exists):", stmt.slice(0, 30));
      } else {
        console.error("Error:", e.message);
      }
    }
  }

  // Seed owner
  try {
    await conn.execute(
      `INSERT INTO admins (username, password, role, is_active) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE password=VALUES(password)`,
      ["shadow", "1234", "owner", "true"]
    );
    console.log("[seed] Owner account created/updated");
  } catch (e: any) {
    console.error("[seed] Owner error:", e.message);
  }

  // Seed services
  try {
    const services = [
      ["TikTok Followers", "followers", "3.00", 100, 50000],
      ["TikTok Likes", "likes", "2.00", 100, 100000],
      ["TikTok Comments", "comments", "5.00", 10, 5000],
      ["TikTok Shares", "shares", "2.50", 100, 50000],
      ["TikTok Views", "views", "0.50", 1000, 1000000],
    ];
    for (const s of services) {
      await conn.execute(
        `INSERT INTO services (name, type, price_per_unit, min_quantity, max_quantity, is_active) VALUES (?, ?, ?, ?, ?, 'true') ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        s
      );
    }
    console.log("[seed] Services created/updated");
  } catch (e: any) {
    console.error("[seed] Services error:", e.message);
  }

  // Seed settings
  try {
    const settings = [
      ["site_title", "TikTok SMM Panel"],
      ["site_description", "Best TikTok services in Pakistan"],
      ["whatsapp_number", "+923001234567"],
      ["owner_username", "shadow"],
      ["owner_password", "1234"],
    ];
    for (const [k, value] of settings) {
      await conn.execute(
        `INSERT INTO settings (\`key\`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value=VALUES(value)`,
        [k, value]
      );
    }
    console.log("[seed] Settings created/updated");
  } catch (e: any) {
    console.error("[seed] Settings error:", e.message);
  }

  await conn.end();
  console.log("Done!");
}

main().catch(console.error);

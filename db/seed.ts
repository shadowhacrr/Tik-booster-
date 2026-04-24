import { eq } from "drizzle-orm";
import { getDb } from "../api/queries/connection";
import * as schema from "./schema";

async function seed() {
  const db = getDb();

  // Seed Owner Account (username: shadow, password: 1234)
  const existingOwner = await db
    .select()
    .from(schema.admins)
    .where(eq(schema.admins.username, "shadow"))
    .limit(1);

  if (existingOwner.length === 0) {
    await db.insert(schema.admins).values({
      username: "shadow",
      password: "1234",
      role: "owner",
      isActive: "true",
    });
    console.log("[seed] Owner account created: shadow / 1234");
  }

  // Seed Default Services
  const existingServices = await db.select().from(schema.services).limit(1);
  if (existingServices.length === 0) {
    await db.insert(schema.services).values([
      { name: "TikTok Followers", type: "followers", pricePerUnit: "3.00", minQuantity: 100, maxQuantity: 50000 },
      { name: "TikTok Likes", type: "likes", pricePerUnit: "2.00", minQuantity: 100, maxQuantity: 100000 },
      { name: "TikTok Comments", type: "comments", pricePerUnit: "5.00", minQuantity: 10, maxQuantity: 5000 },
      { name: "TikTok Shares", type: "shares", pricePerUnit: "2.50", minQuantity: 100, maxQuantity: 50000 },
      { name: "TikTok Views", type: "views", pricePerUnit: "0.50", minQuantity: 1000, maxQuantity: 1000000 },
    ]);
    console.log("[seed] Default services created");
  }

  // Seed Settings
  const existingSettings = await db.select().from(schema.settings).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(schema.settings).values([
      { key: "site_title", value: "TikTok SMM Panel" },
      { key: "site_description", value: "Best TikTok services in Pakistan" },
      { key: "whatsapp_number", value: "+923001234567" },
      { key: "owner_username", value: "shadow" },
      { key: "owner_password", value: "1234" },
    ]);
    console.log("[seed] Default settings created");
  }

  console.log("[seed] Seeding complete!");
}

seed().catch(console.error);

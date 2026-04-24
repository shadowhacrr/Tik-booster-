import {
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  int,
  bigint,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

// ===== USERS (OAuth system - keep for compatibility) =====
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ===== ADMINS (Owner + Admin accounts) =====
export const admins = mysqlTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["owner", "admin"]).default("admin").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentNumber: varchar("payment_number", { length: 20 }),
  paymentName: varchar("payment_name", { length: 100 }),
  referralCode: varchar("referral_code", { length: 255 }).unique(),
  isActive: mysqlEnum("is_active", ["true", "false"]).default("true").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;

// ===== SERVICES (Pricing) =====
export const services = mysqlTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["followers", "likes", "comments", "shares", "views"]).notNull(),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  minQuantity: int("min_quantity").default(100).notNull(),
  maxQuantity: int("max_quantity").default(100000).notNull(),
  isActive: mysqlEnum("is_active", ["true", "false"]).default("true").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

// ===== ORDERS =====
export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  tiktokUsername: varchar("tiktok_username", { length: 255 }).notNull(),
  serviceId: bigint("service_id", { mode: "number", unsigned: true }).notNull(),
  quantity: int("quantity").notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "processing", "completed", "cancelled"]).default("pending").notNull(),
  adminId: bigint("admin_id", { mode: "number", unsigned: true }).notNull(),
  referralCode: varchar("referral_code", { length: 255 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  transactionId: varchar("transaction_id", { length: 255 }),
  paymentScreenshot: text("payment_screenshot"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ===== REVIEWS =====
export const reviews = mysqlTable("reviews", {
  id: serial("id").primaryKey(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  adminId: bigint("admin_id", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ===== COMPLAINTS =====
export const complaints = mysqlTable("complaints", {
  id: serial("id").primaryKey(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
  message: text("message").notNull(),
  whatsappNumber: varchar("whatsapp_number", { length: 20 }),
  status: mysqlEnum("status", ["open", "resolved"]).default("open").notNull(),
  adminId: bigint("admin_id", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = typeof complaints.$inferInsert;

// ===== ADMIN MESSAGES =====
export const adminMessages = mysqlTable("admin_messages", {
  id: serial("id").primaryKey(),
  adminId: bigint("admin_id", { mode: "number", unsigned: true }).notNull(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminMessage = typeof adminMessages.$inferSelect;
export type InsertAdminMessage = typeof adminMessages.$inferInsert;

// ===== SETTINGS =====
export const settings = mysqlTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

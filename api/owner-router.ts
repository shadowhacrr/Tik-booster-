import { eq, desc, count, sql } from "drizzle-orm";
import { z } from "zod";
import { createRouter, panelOwnerQuery, panelAnyRoleQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";

export const ownerRouter = createRouter({
  // Admin Management
  getAllAdmins: panelOwnerQuery.query(async () => {
    const db = getDb();
    const rows = await db.select().from(schema.admins).orderBy(desc(schema.admins.createdAt));
    return rows;
  }),

  createAdmin: panelOwnerQuery
    .input(
      z.object({
        username: z.string().min(3).max(255),
        password: z.string().min(1).max(255),
        role: z.enum(["owner", "admin"]).default("admin"),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(schema.admins).values({
        username: input.username,
        password: input.password,
        role: input.role,
        isActive: "true",
      });
      return { success: true };
    }),

  deleteAdmin: panelOwnerQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      // Don't delete owner
      const [admin] = await db
        .select()
        .from(schema.admins)
        .where(eq(schema.admins.id, input.id))
        .limit(1);
      if (admin?.role === "owner") {
        throw new Error("Cannot delete owner account");
      }
      await db.delete(schema.admins).where(eq(schema.admins.id, input.id));
      return { success: true };
    }),

  toggleAdminStatus: panelOwnerQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [admin] = await db
        .select()
        .from(schema.admins)
        .where(eq(schema.admins.id, input.id))
        .limit(1);
      if (!admin) throw new Error("Admin not found");
      if (admin.role === "owner") throw new Error("Cannot toggle owner status");

      const newStatus = admin.isActive === "true" ? "false" : "true";
      await db
        .update(schema.admins)
        .set({ isActive: newStatus })
        .where(eq(schema.admins.id, input.id));
      return { success: true, newStatus };
    }),

  // Services Management
  getAllServices: panelOwnerQuery.query(async () => {
    const db = getDb();
    return db.select().from(schema.services).orderBy(desc(schema.services.createdAt));
  }),

  createService: panelOwnerQuery
    .input(
      z.object({
        name: z.string().min(1),
        type: z.enum(["followers", "likes", "comments", "shares", "views"]),
        pricePerUnit: z.string().min(1),
        minQuantity: z.number().positive().default(100),
        maxQuantity: z.number().positive().default(100000),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(schema.services).values({
        name: input.name,
        type: input.type,
        pricePerUnit: input.pricePerUnit,
        minQuantity: input.minQuantity,
        maxQuantity: input.maxQuantity,
        isActive: "true",
      });
      return { success: true };
    }),

  updateService: panelOwnerQuery
    .input(
      z.object({
        id: z.number().positive(),
        name: z.string().min(1),
        type: z.enum(["followers", "likes", "comments", "shares", "views"]),
        pricePerUnit: z.string().min(1),
        minQuantity: z.number().positive(),
        maxQuantity: z.number().positive(),
        isActive: z.enum(["true", "false"]),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(schema.services)
        .set({
          name: input.name,
          type: input.type,
          pricePerUnit: input.pricePerUnit,
          minQuantity: input.minQuantity,
          maxQuantity: input.maxQuantity,
          isActive: input.isActive,
        })
        .where(eq(schema.services.id, input.id));
      return { success: true };
    }),

  deleteService: panelOwnerQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(schema.services).where(eq(schema.services.id, input.id));
      return { success: true };
    }),

  // Orders Monitoring
  getAllOrders: panelOwnerQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.orders)
      .orderBy(desc(schema.orders.createdAt));

    const enriched = await Promise.all(
      rows.map(async (order) => {
        const [service] = await db
          .select()
          .from(schema.services)
          .where(eq(schema.services.id, order.serviceId))
          .limit(1);
        const [admin] = await db
          .select()
          .from(schema.admins)
          .where(eq(schema.admins.id, order.adminId))
          .limit(1);
        return { ...order, service, admin };
      }),
    );
    return enriched;
  }),

  // Reviews
  getAllReviews: panelOwnerQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.reviews)
      .orderBy(desc(schema.reviews.createdAt));

    const enriched = await Promise.all(
      rows.map(async (review) => {
        const [order] = await db
          .select()
          .from(schema.orders)
          .where(eq(schema.orders.id, review.orderId))
          .limit(1);
        const [admin] = await db
          .select()
          .from(schema.admins)
          .where(eq(schema.admins.id, review.adminId))
          .limit(1);
        return { ...review, order, admin };
      }),
    );
    return enriched;
  }),

  // Complaints
  getAllComplaints: panelOwnerQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.complaints)
      .orderBy(desc(schema.complaints.createdAt));

    const enriched = await Promise.all(
      rows.map(async (complaint) => {
        const [order] = await db
          .select()
          .from(schema.orders)
          .where(eq(schema.orders.id, complaint.orderId))
          .limit(1);
        const [admin] = await db
          .select()
          .from(schema.admins)
          .where(eq(schema.admins.id, complaint.adminId))
          .limit(1);
        return { ...complaint, order, admin };
      }),
    );
    return enriched;
  }),

  resolveComplaint: panelOwnerQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(schema.complaints)
        .set({ status: "resolved" })
        .where(eq(schema.complaints.id, input.id));
      return { success: true };
    }),

  // Dashboard Stats
  getDashboardStats: panelOwnerQuery.query(async () => {
    const db = getDb();

    const [totalOrders] = await db.select({ count: count() }).from(schema.orders);
    const [pending] = await db
      .select({ count: count() })
      .from(schema.orders)
      .where(eq(schema.orders.status, "pending"));
    const [completed] = await db
      .select({ count: count() })
      .from(schema.orders)
      .where(eq(schema.orders.status, "completed"));
    const [totalRevenue] = await db
      .select({ total: sql<number>`COALESCE(SUM(${schema.orders.totalPrice}), 0)` })
      .from(schema.orders)
      .where(eq(schema.orders.status, "completed"));
    const [totalAdmins] = await db.select({ count: count() }).from(schema.admins);
    const [totalReviews] = await db.select({ count: count() }).from(schema.reviews);
    const [totalComplaints] = await db.select({ count: count() }).from(schema.complaints);

    // Per-admin stats
    const adminRows = await db.select().from(schema.admins);
    const adminStats = await Promise.all(
      adminRows.map(async (admin) => {
        const [adminOrders] = await db
          .select({ count: count() })
          .from(schema.orders)
          .where(eq(schema.orders.adminId, admin.id));
        const [adminCompleted] = await db
          .select({ count: count() })
          .from(schema.orders)
          .where(
            sql`${schema.orders.adminId} = ${admin.id} AND ${schema.orders.status} = 'completed'`,
          );
        const [adminPending] = await db
          .select({ count: count() })
          .from(schema.orders)
          .where(
            sql`${schema.orders.adminId} = ${admin.id} AND ${schema.orders.status} = 'pending'`,
          );
        return {
          admin,
          total: adminOrders?.count ?? 0,
          completed: adminCompleted?.count ?? 0,
          pending: adminPending?.count ?? 0,
        };
      }),
    );

    return {
      totalOrders: totalOrders?.count ?? 0,
      pending: pending?.count ?? 0,
      completed: completed?.count ?? 0,
      totalRevenue: totalRevenue?.total ?? 0,
      totalAdmins: totalAdmins?.count ?? 0,
      totalReviews: totalReviews?.count ?? 0,
      totalComplaints: totalComplaints?.count ?? 0,
      adminStats,
    };
  }),

  // Settings
  getSettings: panelOwnerQuery.query(async () => {
    const db = getDb();
    const rows = await db.select().from(schema.settings);
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  }),

  updateSetting: panelOwnerQuery
    .input(z.object({ key: z.string().min(1), value: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .insert(schema.settings)
        .values({ key: input.key, value: input.value })
        .onDuplicateKeyUpdate({ set: { value: input.value } });
      return { success: true };
    }),

  changeOwnerPassword: panelOwnerQuery
    .input(z.object({ newPassword: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(schema.admins)
        .set({ password: input.newPassword })
        .where(eq(schema.admins.id, ctx.panelUser.id));
      // Also update settings
      await db
        .insert(schema.settings)
        .values({ key: "owner_password", value: input.newPassword })
        .onDuplicateKeyUpdate({ set: { value: input.newPassword } });
      return { success: true };
    }),

  // Admin can also get their own stats through this router
  getAdminDetail: panelAnyRoleQuery
    .input(z.object({ adminId: z.number().positive() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      if (ctx.panelUser.role !== "owner" && ctx.panelUser.id !== input.adminId) {
        throw new Error("Not authorized");
      }

      const [admin] = await db
        .select()
        .from(schema.admins)
        .where(eq(schema.admins.id, input.adminId))
        .limit(1);

      const orders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.adminId, input.adminId))
        .orderBy(desc(schema.orders.createdAt));

      return { admin, orders };
    }),
});

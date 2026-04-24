import { eq, and, desc, sql, count } from "drizzle-orm";
import { z } from "zod";
import { createRouter, panelAnyRoleQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";

export const adminRouter = createRouter({
  getMyOrders: panelAnyRoleQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.adminId, ctx.panelUser.id))
      .orderBy(desc(schema.orders.createdAt));

    const ordersWithService = await Promise.all(
      rows.map(async (order) => {
        const [service] = await db
          .select()
          .from(schema.services)
          .where(eq(schema.services.id, order.serviceId))
          .limit(1);
        return { ...order, service };
      }),
    );

    return ordersWithService;
  }),

  updateOrderStatus: panelAnyRoleQuery
    .input(
      z.object({
        orderId: z.number().positive(),
        status: z.enum(["pending", "confirmed", "processing", "completed", "cancelled"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [order] = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, input.orderId))
        .limit(1);

      if (!order) throw new Error("Order not found");
      if (order.adminId !== ctx.panelUser.id && ctx.panelUser.role !== "owner") {
        throw new Error("Not authorized");
      }

      await db
        .update(schema.orders)
        .set({ status: input.status })
        .where(eq(schema.orders.id, input.orderId));

      return { success: true };
    }),

  sendMessage: panelAnyRoleQuery
    .input(
      z.object({
        orderId: z.number().positive(),
        message: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.insert(schema.adminMessages).values({
        adminId: ctx.panelUser.id,
        orderId: input.orderId,
        message: input.message,
      });
      return { success: true };
    }),

  getMyMessages: panelAnyRoleQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.adminMessages)
      .where(eq(schema.adminMessages.adminId, ctx.panelUser.id))
      .orderBy(desc(schema.adminMessages.createdAt));
    return rows;
  }),

  getStats: panelAnyRoleQuery.query(async ({ ctx }) => {
    const db = getDb();
    const baseCondition = eq(schema.orders.adminId, ctx.panelUser.id);

    const [pending] = await db
      .select({ count: count() })
      .from(schema.orders)
      .where(and(baseCondition, eq(schema.orders.status, "pending")));

    const [confirmed] = await db
      .select({ count: count() })
      .from(schema.orders)
      .where(and(baseCondition, eq(schema.orders.status, "confirmed")));

    const [processing] = await db
      .select({ count: count() })
      .from(schema.orders)
      .where(and(baseCondition, eq(schema.orders.status, "processing")));

    const [completed] = await db
      .select({ count: count() })
      .from(schema.orders)
      .where(and(baseCondition, eq(schema.orders.status, "completed")));

    const [cancelled] = await db
      .select({ count: count() })
      .from(schema.orders)
      .where(and(baseCondition, eq(schema.orders.status, "cancelled")));

    const [revenue] = await db
      .select({ total: sql<number>`COALESCE(SUM(${schema.orders.totalPrice}), 0)` })
      .from(schema.orders)
      .where(and(baseCondition, eq(schema.orders.status, "completed")));

    return {
      pending: pending?.count ?? 0,
      confirmed: confirmed?.count ?? 0,
      processing: processing?.count ?? 0,
      completed: completed?.count ?? 0,
      cancelled: cancelled?.count ?? 0,
      revenue: revenue?.total ?? 0,
    };
  }),

  updatePaymentInfo: panelAnyRoleQuery
    .input(
      z.object({
        paymentMethod: z.string().min(1),
        paymentNumber: z.string().min(1),
        paymentName: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [admin] = await db
        .select()
        .from(schema.admins)
        .where(eq(schema.admins.id, ctx.panelUser.id))
        .limit(1);

      const referralCode = admin?.referralCode || `ref_${ctx.panelUser.id}_${Date.now()}`;

      await db
        .update(schema.admins)
        .set({
          paymentMethod: input.paymentMethod,
          paymentNumber: input.paymentNumber,
          paymentName: input.paymentName,
          referralCode,
        })
        .where(eq(schema.admins.id, ctx.panelUser.id));

      return {
        success: true,
        referralCode,
        referralLink: `${ctx.req.headers.get("origin") || ""}/?ref=${referralCode}`,
      };
    }),

  getMyProfile: panelAnyRoleQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.admins)
      .where(eq(schema.admins.id, ctx.panelUser.id))
      .limit(1);
    return rows.at(0) ?? null;
  }),
});

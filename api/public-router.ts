import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";

export const publicRouter = createRouter({
  getServices: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.services)
      .where(eq(schema.services.isActive, "true"));
    return rows;
  }),

  getAdminByReferral: publicQuery
    .input(z.object({ referralCode: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.admins)
        .where(eq(schema.admins.referralCode, input.referralCode))
        .limit(1);
      return rows.at(0) ?? null;
    }),

  getSettings: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.select().from(schema.settings);
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  }),

  createOrder: publicQuery
    .input(
      z.object({
        tiktokUsername: z.string().min(1).max(255),
        serviceId: z.number().positive(),
        quantity: z.number().positive(),
        totalPrice: z.string().min(1),
        referralCode: z.string().min(1),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        paymentMethod: z.string().min(1),
        transactionId: z.string().optional(),
        paymentScreenshot: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Find admin by referral code
      const admins = await db
        .select()
        .from(schema.admins)
        .where(eq(schema.admins.referralCode, input.referralCode))
        .limit(1);

      const admin = admins.at(0);
      if (!admin || admin.isActive !== "true") {
        throw new Error("Invalid referral code");
      }

      await db.insert(schema.orders).values({
        tiktokUsername: input.tiktokUsername,
        serviceId: input.serviceId,
        quantity: input.quantity,
        totalPrice: input.totalPrice,
        adminId: admin.id,
        referralCode: input.referralCode,
        customerName: input.customerName ?? null,
        customerPhone: input.customerPhone ?? null,
        paymentMethod: input.paymentMethod,
        transactionId: input.transactionId ?? null,
        paymentScreenshot: input.paymentScreenshot ?? null,
        status: "pending",
      });

      const latest = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.tiktokUsername, input.tiktokUsername))
        .orderBy(desc(schema.orders.createdAt))
        .limit(1);

      return { success: true, orderId: latest[0]?.id ?? 0 };
    }),

  getOrderStatus: publicQuery
    .input(z.object({ orderId: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, input.orderId))
        .limit(1);

      const order = rows.at(0);
      if (!order) return null;

      const [serviceRows, messageRows] = await Promise.all([
        db.select().from(schema.services).where(eq(schema.services.id, order.serviceId)).limit(1),
        db
          .select()
          .from(schema.adminMessages)
          .where(eq(schema.adminMessages.orderId, order.id))
          .orderBy(schema.adminMessages.createdAt),
      ]);

      return {
        ...order,
        service: serviceRows.at(0),
        messages: messageRows,
      };
    }),

  submitReview: publicQuery
    .input(
      z.object({
        orderId: z.number().positive(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
        adminId: z.number().positive(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(schema.reviews).values({
        orderId: input.orderId,
        rating: input.rating,
        comment: input.comment ?? null,
        adminId: input.adminId,
      });
      return { success: true };
    }),

  submitComplaint: publicQuery
    .input(
      z.object({
        orderId: z.number().positive(),
        message: z.string().min(1),
        whatsappNumber: z.string().optional(),
        adminId: z.number().positive(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(schema.complaints).values({
        orderId: input.orderId,
        message: input.message,
        whatsappNumber: input.whatsappNumber ?? null,
        adminId: input.adminId,
      });
      return { success: true };
    }),
});

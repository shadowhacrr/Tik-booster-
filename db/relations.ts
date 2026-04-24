import { relations } from "drizzle-orm";
import { admins, services, orders, reviews, complaints, adminMessages } from "./schema";

export const adminsRelations = relations(admins, ({ many }) => ({
  orders: many(orders),
  reviews: many(reviews),
  complaints: many(complaints),
  messages: many(adminMessages),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  admin: one(admins, {
    fields: [orders.adminId],
    references: [admins.id],
  }),
  service: one(services, {
    fields: [orders.serviceId],
    references: [services.id],
  }),
  reviews: many(reviews),
  complaints: many(complaints),
  messages: many(adminMessages),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
  admin: one(admins, {
    fields: [reviews.adminId],
    references: [admins.id],
  }),
}));

export const complaintsRelations = relations(complaints, ({ one }) => ({
  order: one(orders, {
    fields: [complaints.orderId],
    references: [orders.id],
  }),
  admin: one(admins, {
    fields: [complaints.adminId],
    references: [admins.id],
  }),
}));

export const adminMessagesRelations = relations(adminMessages, ({ one }) => ({
  order: one(orders, {
    fields: [adminMessages.orderId],
    references: [orders.id],
  }),
  admin: one(admins, {
    fields: [adminMessages.adminId],
    references: [admins.id],
  }),
}));

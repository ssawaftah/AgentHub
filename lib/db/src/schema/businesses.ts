import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";

export const businessesTable = pgTable("businesses", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspacesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  description: text("description"),
  timezone: text("timezone").notNull().default("UTC"),
  language: text("language"),
  website: text("website"),
  email: text("email"),
  phone: text("phone"),
  brandVoice: text("brand_voice"),
  brandPersonality: text("brand_personality"),
  returnPolicy: text("return_policy"),
  shippingPolicy: text("shipping_policy"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBusinessSchema = createInsertSchema(businessesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businessesTable.$inferSelect;

import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";
import { businessesTable } from "./businesses";

export const agentsTable = pgTable("agents", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspacesTable.id, { onDelete: "cascade" }),
  businessId: integer("business_id").references(() => businessesTable.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull(),
  job: text("job"),
  description: text("description"),
  language: text("language").notNull().default("en"),
  tone: text("tone").notNull().default("professional"),
  personality: text("personality"),
  instructions: text("instructions"),
  goal: text("goal"),
  emojiLevel: integer("emoji_level").notNull().default(3),
  humorLevel: integer("humor_level").notNull().default(2),
  creativity: integer("creativity").notNull().default(5),
  temperature: real("temperature").notNull().default(0.7),
  maxTokens: integer("max_tokens").notNull().default(1024),
  provider: text("provider").notNull().default("gemini"),
  model: text("model").notNull().default("gemini-2.0-flash"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAgentSchema = createInsertSchema(agentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agentsTable.$inferSelect;

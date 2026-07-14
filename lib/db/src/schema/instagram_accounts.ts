import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";
import { agentsTable } from "./agents";

export const instagramAccountsTable = pgTable("instagram_accounts", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspacesTable.id, { onDelete: "cascade" }),
  agentId: integer("agent_id").references(() => agentsTable.id, {
    onDelete: "set null",
  }),
  igUserId: text("ig_user_id").notNull(),
  igUsername: text("ig_username").notNull(),
  igProfilePicUrl: text("ig_profile_pic_url"),
  accessToken: text("access_token").notNull(), // long-lived page access token; encrypt at rest in production
  webhookVerifyToken: text("webhook_verify_token").notNull(), // per-account verify token shown in Meta App dashboard setup
  status: text("status").notNull().default("active"), // active | disconnected | error
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertInstagramAccountSchema = createInsertSchema(
  instagramAccountsTable,
).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertInstagramAccount = z.infer<typeof insertInstagramAccountSchema>;
export type InstagramAccount = typeof instagramAccountsTable.$inferSelect;

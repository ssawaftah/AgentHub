import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";
import { agentsTable } from "./agents";

export const aiBrainsTable = pgTable("ai_brains", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspacesTable.id, { onDelete: "cascade" }),
  agentId: integer("agent_id")
    .references(() => agentsTable.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  systemPrompt: text("system_prompt"),
  fallbackMessage: text("fallback_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertAiBrainSchema = createInsertSchema(aiBrainsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAiBrain = z.infer<typeof insertAiBrainSchema>;
export type AiBrain = typeof aiBrainsTable.$inferSelect;

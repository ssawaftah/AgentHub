import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { instagramAccountsTable } from "./instagram_accounts";

export const instagramMessagesTable = pgTable("instagram_messages", {
  id: serial("id").primaryKey(),
  instagramAccountId: integer("instagram_account_id")
    .notNull()
    .references(() => instagramAccountsTable.id, { onDelete: "cascade" }),
  igMessageId: text("ig_message_id").notNull().unique(), // dedup key
  fromIgUserId: text("from_ig_user_id").notNull(),
  messageText: text("message_text").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  replySent: boolean("reply_sent").notNull().default(false),
  error: text("error"),
});

export type InstagramMessage = typeof instagramMessagesTable.$inferSelect;

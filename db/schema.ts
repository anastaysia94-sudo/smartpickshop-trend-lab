import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const niches = sqliteTable("niches", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  name: text("name").notNull(),
  demand: integer("demand").notNull(),
  competition: integer("competition").notNull(),
  urgency: integer("urgency").notNull(),
  monetization: integer("monetization").notNull(),
  evidence: text("evidence").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
}, table => [index("idx_niches_owner_updated").on(table.ownerId, table.updatedAt)]);

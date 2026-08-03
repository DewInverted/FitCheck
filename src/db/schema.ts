import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

export const clothingItems = pgTable("clothing_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  primaryColor: text("primary_color").notNull(),
  secondaryColor: text("secondary_color"),
  pattern: text("pattern"),
  fit: text("fit"),
  season: text("season"),
  occasion: text("occasion"),
  brand: text("brand"),
  imageData: text("image_data").notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  wearCount: integer("wear_count").default(0),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const outfits = pgTable("outfits", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  itemIds: jsonb("item_ids").$type<string[]>().notNull(),
  style: text("style"),
  occasion: text("occasion"),
  season: text("season"),
  source: text("source").default("closet"), // "closet" | "suggested" | "mixed"
  rating: integer("rating"),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  gender: text("gender").notNull(),
  defaultStyle: text("default_style").notNull(),
  showSuggested: boolean("show_suggested").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ClothingItem = typeof clothingItems.$inferSelect;
export type NewClothingItem = typeof clothingItems.$inferInsert;
export type Outfit = typeof outfits.$inferSelect;
export type NewOutfit = typeof outfits.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;

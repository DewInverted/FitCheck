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
  category: text("category").notNull(), // top, bottom, shoes, outerwear, accessory
  subcategory: text("subcategory"), // t-shirt, jeans, sneakers, etc.
  primaryColor: text("primary_color").notNull(),
  secondaryColor: text("secondary_color"),
  pattern: text("pattern"), // solid, striped, plaid, etc.
  fit: text("fit"), // oversized, regular, slim, skinny, baggy, relaxed
  season: text("season"), // spring, summer, fall, winter, all
  occasion: text("occasion"), // casual, formal, sport, business
  brand: text("brand"),
  imageData: text("image_data").notNull(), // base64 image
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
  occasion: text("occasion"),
  season: text("season"),
  rating: integer("rating"),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ClothingItem = typeof clothingItems.$inferSelect;
export type NewClothingItem = typeof clothingItems.$inferInsert;
export type Outfit = typeof outfits.$inferSelect;
export type NewOutfit = typeof outfits.$inferInsert;

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  gender: text("gender").notNull(), // male, female
  defaultStyle: text("default_style").notNull(), // style preset id
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;

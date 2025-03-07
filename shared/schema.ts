import { pgTable, text, bigint, jsonb, timestamp, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const decks = pgTable("decks", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  cards: jsonb("cards").$type<DeckCard[]>().notNull().default([]),
  pickedUpCards: jsonb("picked_up_cards").$type<DeckCard[]>().notNull().default([]),
  format: text("format"),
  isValid: boolean("is_valid").default(true),
  notes: text("notes")
});

export const sharedDecks = pgTable("shared_decks", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  shareCode: text("share_code").notNull().unique(),
  deckId: bigint("deck_id", { mode: "number" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  cards: jsonb("cards").$type<DeckCard[]>().notNull(),
  format: text("format"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  views: bigint("views", { mode: "number" }).default(0),
  isActive: boolean("is_active").default(true)
});

export const priceHistory = pgTable("price_history", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  cardId: text("card_id").notNull(),
  source: text("source").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});

export const priceAlerts = pgTable("price_alerts", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  cardId: text("card_id").notNull(),
  targetPrice: decimal("target_price", { precision: 10, scale: 2 }).notNull(),
  isAbove: boolean("is_above").notNull(),
  isActive: boolean("is_active").default(true),
  lastNotified: timestamp("last_notified")
});

export const cardMetadata = pgTable("card_metadata", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  manaCost: text("mana_cost"),
  cmc: decimal("cmc", { precision: 4, scale: 1 }),
  colors: text("colors").array(),
  types: text("types").array(),
  format_legality: jsonb("format_legality").$type<Record<string, string>>(),
  keywords: text("keywords").array(),
  power: text("power"),
  toughness: text("toughness"),
  rarity: text("rarity")
});

export const wishlistCards = pgTable("wishlist_cards", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  cards: jsonb("cards").$type<DeckCard[]>().notNull().default([])
});

export const insertDeckSchema = createInsertSchema(decks).pick({
  name: true,
  description: true,
  format: true
});

export const insertSharedDeckSchema = createInsertSchema(sharedDecks).pick({
  shareCode: true,
  deckId: true,
  name: true,
  description: true,
  format: true
});

export type InsertDeck = z.infer<typeof insertDeckSchema>;
export type Deck = typeof decks.$inferSelect;
export type SharedDeck = typeof sharedDecks.$inferSelect;
export type InsertSharedDeck = z.infer<typeof insertSharedDeckSchema>;

export interface DeckCard {
  id: string;
  name: string;
  sets: Array<{
    code: string;
    name: string;
    symbol: string;
  }>;
  prices: {
    tcgplayer: number | null;
    cardkingdom: number | null;
  };
  imageUrl: string;
}

export interface DeckAnalysis {
  manaCurve: Record<number, number>;
  colorDistribution: Record<string, number>;
  cardTypes: Record<string, number>;
  averageCmc: number;
  landCount: number;
}

export interface PriceAlert {
  id: number;
  cardId: string;
  targetPrice: number;
  isAbove: boolean;
  isActive: boolean;
  lastNotified: Date | null;
}

export interface PriceHistory {
  id: number;
  cardId: string;
  source: string;
  price: number;
  timestamp: Date;
}
import { pgTable, text, serial, jsonb, timestamp, boolean, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  cards: jsonb("cards").$type<DeckCard[]>().notNull().default([]),
  pickedUpCards: jsonb("picked_up_cards").$type<DeckCard[]>().notNull().default([]),
  pulledCards: jsonb("pulled_cards").$type<DeckCard[]>().notNull().default([]),
  format: text("format"), // For tournament support
  isValid: boolean("is_valid").default(true), // For tournament legality
  notes: text("notes") // For deck notes
});

export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  cardId: text("card_id").notNull(),
  source: text("source").notNull(), // tcgplayer, cardkingdom, etc.
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});

export const priceAlerts = pgTable("price_alerts", {
  id: serial("id").primaryKey(),
  cardId: text("card_id").notNull(),
  targetPrice: decimal("target_price", { precision: 10, scale: 2 }).notNull(),
  isAbove: boolean("is_above").notNull(), // true for price increase alerts, false for decrease
  isActive: boolean("is_active").default(true),
  lastNotified: timestamp("last_notified")
});

export const cardMetadata = pgTable("card_metadata", {
  id: text("id").primaryKey(), // Scryfall ID
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
  id: serial("id").primaryKey(),
  cards: jsonb("cards").$type<DeckCard[]>().notNull().default([])
});

export const insertDeckSchema = createInsertSchema(decks).pick({
  name: true,
  description: true,
  format: true
});

export type InsertDeck = z.infer<typeof insertDeckSchema>;
export type Deck = typeof decks.$inferSelect & {
  pulledCards: DeckCard[];
};

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
  selectedSet?: {
    code: string;
    name: string;
    symbol: string;
    prices: {
      tcgplayer: number | null;
      cardkingdom: number | null;
    };
  };
  selectedSet?: {
    code: string;
    name: string;
    symbol: string;
    prices: {
      tcgplayer: number | null;
      cardkingdom: number | null;
    };
  };
}

// New types for metadata and analysis
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
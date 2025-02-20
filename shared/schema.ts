import { pgTable, text, serial, jsonb, timestamp, boolean, integer, decimal, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  cards: jsonb("cards").$type<DeckCard[]>().notNull().default([]),
  pickedUpCards: jsonb("picked_up_cards").$type<DeckCard[]>().notNull().default([]),
  format: text("format"),
  isValid: boolean("is_valid").default(true),
  notes: text("notes")
});

export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  cardId: text("card_id").notNull(),
  source: text("source").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});

export const priceAlerts = pgTable("price_alerts", {
  id: serial("id").primaryKey(),
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
  id: serial("id").primaryKey(),
  cards: jsonb("cards").$type<DeckCard[]>().notNull().default([])
});

export const cardCombinations = pgTable("card_combinations", {
  cardId: text("card_id").notNull().references(() => cardMetadata.id),
  combinedWithId: text("combined_with_id").notNull().references(() => cardMetadata.id),
  frequency: integer("frequency").notNull().default(1),
  synergy: decimal("synergy", { precision: 4, scale: 2 }).notNull().default('0.5'),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  pk: primaryKey(table.cardId, table.combinedWithId)
}));

export const budgetAlternatives = pgTable("budget_alternatives", {
  id: serial("id").primaryKey(),
  expensiveCardId: text("expensive_card_id").notNull().references(() => cardMetadata.id),
  budgetCardId: text("budget_card_id").notNull().references(() => cardMetadata.id),
  priceRatio: decimal("price_ratio", { precision: 6, scale: 2 }).notNull(),
  similarityScore: decimal("similarity_score", { precision: 4, scale: 2 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertDeckSchema = createInsertSchema(decks).pick({
  name: true,
  description: true,
  format: true
});

export type InsertDeck = z.infer<typeof insertDeckSchema>;
export type Deck = typeof decks.$inferSelect;

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

export interface CardRecommendation {
  card: typeof cardMetadata.$inferSelect;
  synergy: number;
  frequency: number;
}

export interface BudgetAlternative {
  originalCard: typeof cardMetadata.$inferSelect;
  budgetCard: typeof cardMetadata.$inferSelect;
  priceRatio: number;
  similarityScore: number;
}
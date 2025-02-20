import { pgTable, text, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  cards: jsonb("cards").$type<DeckCard[]>().notNull().default([]),
  pickedUpCards: jsonb("picked_up_cards").$type<DeckCard[]>().notNull().default([])
});

export const insertDeckSchema = createInsertSchema(decks).pick({
  name: true,
  description: true
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
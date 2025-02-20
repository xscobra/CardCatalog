import { decks, wishlistCards, type Deck, type InsertDeck, type DeckCard } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getDeck(id: number): Promise<Deck | undefined>;
  getAllDecks(): Promise<Deck[]>;
  createDeck(deck: InsertDeck): Promise<Deck>;
  updateDeck(id: number, deck: Partial<Deck>): Promise<Deck | undefined>;
  deleteDeck(id: number): Promise<boolean>;
  getWishlistCards(): Promise<DeckCard[]>;
  updateWishlistCards(cards: DeckCard[]): Promise<DeckCard[]>;
}

export class DatabaseStorage implements IStorage {
  async getDeck(id: number): Promise<Deck | undefined> {
    const [deck] = await db.select().from(decks).where(eq(decks.id, id));
    return deck || undefined;
  }

  async getAllDecks(): Promise<Deck[]> {
    return await db.select().from(decks);
  }

  async createDeck(insertDeck: InsertDeck): Promise<Deck> {
    const [deck] = await db
      .insert(decks)
      .values(insertDeck)
      .returning();
    return deck;
  }

  async updateDeck(id: number, updates: Partial<Deck>): Promise<Deck | undefined> {
    const [deck] = await db
      .update(decks)
      .set(updates)
      .where(eq(decks.id, id))
      .returning();
    return deck || undefined;
  }

  async deleteDeck(id: number): Promise<boolean> {
    const [deck] = await db
      .delete(decks)
      .where(eq(decks.id, id))
      .returning();
    return !!deck;
  }

  async getWishlistCards(): Promise<DeckCard[]> {
    const [wishlist] = await db.select().from(wishlistCards);
    return wishlist?.cards || [];
  }

  async updateWishlistCards(cards: DeckCard[]): Promise<DeckCard[]> {
    const [wishlist] = await db.select().from(wishlistCards);
    if (wishlist) {
      const [updated] = await db
        .update(wishlistCards)
        .set({ cards })
        .where(eq(wishlistCards.id, wishlist.id))
        .returning();
      return updated.cards;
    } else {
      const [created] = await db
        .insert(wishlistCards)
        .values({ cards })
        .returning();
      return created.cards;
    }
  }
}

export const storage = new DatabaseStorage();
import { decks, type Deck, type InsertDeck } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getDeck(id: number): Promise<Deck | undefined>;
  getAllDecks(): Promise<Deck[]>;
  createDeck(deck: InsertDeck): Promise<Deck>;
  updateDeck(id: number, deck: Partial<Deck>): Promise<Deck | undefined>;
  deleteDeck(id: number): Promise<boolean>;
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
}

export const storage = new DatabaseStorage();
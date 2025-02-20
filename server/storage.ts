import { decks, wishlistCards, priceHistory, priceAlerts, cardMetadata, 
  type Deck, type InsertDeck, type DeckCard, type PriceAlert, type PriceHistory } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  getDeck(id: number): Promise<Deck | undefined>;
  getAllDecks(): Promise<Deck[]>;
  createDeck(deck: InsertDeck): Promise<Deck>;
  updateDeck(id: number, deck: Partial<Deck>): Promise<Deck | undefined>;
  deleteDeck(id: number): Promise<boolean>;
  getWishlistCards(): Promise<DeckCard[]>;
  updateWishlistCards(cards: DeckCard[]): Promise<DeckCard[]>;

  addPriceHistory(cardId: string, source: string, price: number): Promise<PriceHistory>;
  getPriceHistory(cardId: string, days?: number): Promise<PriceHistory[]>;
  createPriceAlert(alert: Omit<PriceAlert, 'id'>): Promise<PriceAlert>;
  getPriceAlerts(cardId?: string): Promise<PriceAlert[]>;
  updatePriceAlert(id: number, updates: Partial<PriceAlert>): Promise<PriceAlert | undefined>;

  upsertCardMetadata(metadata: typeof cardMetadata.$inferInsert): Promise<typeof cardMetadata.$inferSelect>;
  getCardMetadata(cardId: string): Promise<typeof cardMetadata.$inferSelect | undefined>;
  getCardsByFormat(format: string): Promise<typeof cardMetadata.$inferSelect[]>;
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

  async addPriceHistory(cardId: string, source: string, price: number): Promise<PriceHistory> {
    const [history] = await db
      .insert(priceHistory)
      .values({ 
        cardId, 
        source, 
        price: price.toString()  // Convert to string for decimal type
      })
      .returning();
    return {
      ...history,
      price: parseFloat(history.price) // Convert back to number for the interface
    };
  }

  async getPriceHistory(cardId: string, days = 30): Promise<PriceHistory[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const results = await db
      .select()
      .from(priceHistory)
      .where(
        and(
          eq(priceHistory.cardId, cardId),
          sql`${priceHistory.timestamp} >= ${cutoffDate}`
        )
      )
      .orderBy(desc(priceHistory.timestamp));

    return results.map(history => ({
      ...history,
      price: parseFloat(history.price) // Convert price strings to numbers
    }));
  }

  async createPriceAlert(alert: Omit<PriceAlert, 'id'>): Promise<PriceAlert> {
    const [created] = await db
      .insert(priceAlerts)
      .values({
        ...alert,
        targetPrice: alert.targetPrice.toString() // Convert to string for decimal type
      })
      .returning();
    return {
      ...created,
      targetPrice: parseFloat(created.targetPrice) // Convert back to number for the interface
    };
  }

  async getPriceAlerts(cardId?: string): Promise<PriceAlert[]> {
    let query = db.select().from(priceAlerts);
    if (cardId) {
      query = query.where(eq(priceAlerts.cardId, cardId));
    }
    const results = await query;
    return results.map(alert => ({
      ...alert,
      targetPrice: parseFloat(alert.targetPrice) // Convert price strings to numbers
    }));
  }

  async updatePriceAlert(id: number, updates: Partial<PriceAlert>): Promise<PriceAlert | undefined> {
    const updatesWithStringPrice = updates.targetPrice !== undefined
      ? { ...updates, targetPrice: updates.targetPrice.toString() }
      : updates;

    const [alert] = await db
      .update(priceAlerts)
      .set(updatesWithStringPrice)
      .where(eq(priceAlerts.id, id))
      .returning();

    if (!alert) return undefined;

    return {
      ...alert,
      targetPrice: parseFloat(alert.targetPrice) // Convert back to number for the interface
    };
  }

  async upsertCardMetadata(metadata: typeof cardMetadata.$inferInsert) {
    const [updated] = await db
      .insert(cardMetadata)
      .values(metadata)
      .onConflictDoUpdate({
        target: cardMetadata.id,
        set: metadata,
      })
      .returning();
    return updated;
  }

  async getCardMetadata(cardId: string) {
    const [metadata] = await db
      .select()
      .from(cardMetadata)
      .where(eq(cardMetadata.id, cardId));
    return metadata;
  }

  async getCardsByFormat(format: string) {
    return await db
      .select()
      .from(cardMetadata)
      .where(sql`${cardMetadata.format_legality}->>${format} = 'legal'`);
  }
}

export const storage = new DatabaseStorage();
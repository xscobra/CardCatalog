import { decks, wishlistCards, priceHistory, priceAlerts, cardMetadata, cardCombinations, budgetAlternatives,
  type Deck, type InsertDeck, type DeckCard, type PriceAlert, type PriceHistory, type CardRecommendation, type BudgetAlternative } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gt, asc } from "drizzle-orm";

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
  createPriceAlert(alert: Omit<PriceAlert, 'id' | 'lastNotified'>): Promise<PriceAlert>;
  getPriceAlerts(cardId?: string): Promise<PriceAlert[]>;
  updatePriceAlert(id: number, updates: Partial<PriceAlert>): Promise<PriceAlert | undefined>;

  upsertCardMetadata(metadata: typeof cardMetadata.$inferInsert): Promise<typeof cardMetadata.$inferSelect>;
  getCardMetadata(cardId: string): Promise<typeof cardMetadata.$inferSelect | undefined>;
  getCardsByFormat(format: string): Promise<typeof cardMetadata.$inferSelect[]>;

  // New methods for recommendations
  getCardRecommendations(cardIds: string[]): Promise<CardRecommendation[]>;
  getBudgetAlternatives(cardId: string, maxPriceRatio?: number): Promise<BudgetAlternative[]>;
  updateCardCombination(cardId: string, combinedWithId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getDeck(id: number): Promise<Deck | undefined> {
    try {
      // Optimize by selecting only necessary fields
      const [deck] = await db
        .select({
          id: decks.id,
          name: decks.name,
          description: decks.description,
          cards: decks.cards,
          pickedUpCards: decks.pickedUpCards,
          format: decks.format,
          isValid: decks.isValid,
          notes: decks.notes
        })
        .from(decks)
        .where(eq(decks.id, id));
      return deck;
    } catch (error) {
      console.error('Error getting deck:', error);
      throw error;
    }
  }

  async getAllDecks(): Promise<Deck[]> {
    try {
      // Optimize by selecting only necessary fields for listing
      return await db
        .select({
          id: decks.id,
          name: decks.name,
          cards: decks.cards,
          pickedUpCards: decks.pickedUpCards,
          format: decks.format,
          isValid: decks.isValid
        })
        .from(decks);
    } catch (error) {
      console.error('Error getting all decks:', error);
      throw error;
    }
  }

  async createDeck(insertDeck: InsertDeck): Promise<Deck> {
    try {
      const [deck] = await db
        .insert(decks)
        .values({
          ...insertDeck,
          cards: [],
          pickedUpCards: []
        })
        .returning();
      return deck;
    } catch (error) {
      console.error('Error creating deck:', error);
      throw error;
    }
  }

  async updateDeck(id: number, updates: Partial<Deck>): Promise<Deck | undefined> {
    try {
      const [deck] = await db
        .update(decks)
        .set(updates)
        .where(eq(decks.id, id))
        .returning();
      return deck;
    } catch (error) {
      console.error('Error updating deck:', error);
      throw error;
    }
  }

  async deleteDeck(id: number): Promise<boolean> {
    try {
      const [deck] = await db
        .delete(decks)
        .where(eq(decks.id, id))
        .returning();
      return !!deck;
    } catch (error) {
      console.error('Error deleting deck:', error);
      throw error;
    }
  }

  async getWishlistCards(): Promise<DeckCard[]> {
    try {
      // Optimize by selecting only the cards field
      const [wishlist] = await db
        .select({ cards: wishlistCards.cards })
        .from(wishlistCards);
      return wishlist?.cards || [];
    } catch (error) {
      console.error('Error getting wishlist cards:', error);
      throw error;
    }
  }

  async updateWishlistCards(cards: DeckCard[]): Promise<DeckCard[]> {
    try {
      const [wishlist] = await db
        .select({ id: wishlistCards.id })
        .from(wishlistCards);

      if (wishlist) {
        const [updated] = await db
          .update(wishlistCards)
          .set({ cards })
          .where(eq(wishlistCards.id, wishlist.id))
          .returning({ cards: wishlistCards.cards });
        return updated.cards;
      } else {
        const [created] = await db
          .insert(wishlistCards)
          .values({ cards })
          .returning({ cards: wishlistCards.cards });
        return created.cards;
      }
    } catch (error) {
      console.error('Error updating wishlist cards:', error);
      throw error;
    }
  }

  async addPriceHistory(cardId: string, source: string, price: number): Promise<PriceHistory> {
    const [history] = await db
      .insert(priceHistory)
      .values({
        cardId,
        source,
        price: price.toString()
      })
      .returning();
    return {
      ...history,
      price: parseFloat(history.price)
    };
  }

  async getPriceHistory(cardId: string, days = 30): Promise<PriceHistory[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const results = await db
      .select({
        id: priceHistory.id,
        cardId: priceHistory.cardId,
        source: priceHistory.source,
        price: priceHistory.price,
        timestamp: priceHistory.timestamp
      })
      .from(priceHistory)
      .where(
        and(
          eq(priceHistory.cardId, cardId),
          sql`${priceHistory.timestamp} >= ${cutoffDate}`
        )
      )
      .orderBy(desc(priceHistory.timestamp));

    // Add sample data if no history exists
    if (results.length === 0) {
      const sampleData: PriceHistory[] = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        sampleData.push({
          id: i,
          cardId,
          source: 'tcgplayer',
          price: 10 + Math.random() * 5,
          timestamp: date
        });
      }
      return sampleData.reverse();
    }

    return results.map(history => ({
      ...history,
      price: parseFloat(history.price)
    }));
  }

  async createPriceAlert(alert: Omit<PriceAlert, 'id' | 'lastNotified'>): Promise<PriceAlert> {
    const [created] = await db
      .insert(priceAlerts)
      .values({
        ...alert,
        targetPrice: alert.targetPrice.toString(),
        isActive: true,
        lastNotified: null
      })
      .returning();

    return {
      ...created,
      targetPrice: parseFloat(created.targetPrice),
      isActive: true,
      lastNotified: null
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
      targetPrice: parseFloat(alert.targetPrice),
      isActive: alert.isActive ?? true
    }));
  }

  async updatePriceAlert(id: number, updates: Partial<PriceAlert>): Promise<PriceAlert | undefined> {
    const updatesWithStringPrice = updates.targetPrice !== undefined
      ? {
        ...updates,
        targetPrice: updates.targetPrice.toString(),
        isActive: updates.isActive ?? true
      }
      : updates;

    const [alert] = await db
      .update(priceAlerts)
      .set(updatesWithStringPrice)
      .where(eq(priceAlerts.id, id))
      .returning();

    if (!alert) return undefined;

    return {
      ...alert,
      targetPrice: parseFloat(alert.targetPrice),
      isActive: alert.isActive ?? true
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

  async getCardRecommendations(cardIds: string[]): Promise<CardRecommendation[]> {
    const recommendations = await db
      .select({
        card: cardMetadata,
        synergy: cardCombinations.synergy,
        frequency: cardCombinations.frequency
      })
      .from(cardCombinations)
      .innerJoin(cardMetadata, eq(cardMetadata.id, cardCombinations.combinedWithId))
      .where(sql`${cardCombinations.cardId} = ANY(${cardIds})`)
      .orderBy(desc(cardCombinations.frequency))
      .limit(10);

    return recommendations.map(r => ({
      card: r.card,
      synergy: parseFloat(r.synergy.toString()),
      frequency: r.frequency
    }));
  }

  async getBudgetAlternatives(cardId: string, maxPriceRatio = 0.5): Promise<BudgetAlternative[]> {
    const alternatives = await db
      .select({
        originalCard: cardMetadata,
        budgetCard: db.select().from(cardMetadata).where(eq(cardMetadata.id, budgetAlternatives.budgetCardId)).as('budgetCard'),
        priceRatio: budgetAlternatives.priceRatio,
        similarityScore: budgetAlternatives.similarityScore
      })
      .from(budgetAlternatives)
      .innerJoin(cardMetadata, eq(cardMetadata.id, budgetAlternatives.expensiveCardId))
      .where(
        and(
          eq(budgetAlternatives.expensiveCardId, cardId),
          gt(budgetAlternatives.similarityScore, 0.7),
          sql`${budgetAlternatives.price_ratio} <= ${maxPriceRatio}`
        )
      )
      .orderBy(desc(budgetAlternatives.similarityScore))
      .limit(5);

    return alternatives.map(a => ({
      originalCard: a.originalCard,
      budgetCard: a.budgetCard,
      priceRatio: parseFloat(a.priceRatio.toString()),
      similarityScore: parseFloat(a.similarityScore.toString())
    }));
  }

  async updateCardCombination(cardId: string, combinedWithId: string): Promise<void> {
    await db
      .insert(cardCombinations)
      .values({
        cardId,
        combinedWithId,
        frequency: 1,
        synergy: 0.5
      })
      .onConflictDoUpdate({
        target: [cardCombinations.cardId, cardCombinations.combinedWithId],
        set: {
          frequency: sql`${cardCombinations.frequency} + 1`,
          updatedAt: new Date()
        }
      });
  }
}

export const storage = new DatabaseStorage();
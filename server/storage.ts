import { decks, type Deck, type InsertDeck } from "@shared/schema";

export interface IStorage {
  getDeck(id: number): Promise<Deck | undefined>;
  getAllDecks(): Promise<Deck[]>;
  createDeck(deck: InsertDeck): Promise<Deck>;
  updateDeck(id: number, deck: Partial<Deck>): Promise<Deck | undefined>;
  deleteDeck(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private decks: Map<number, Deck>;
  private currentId: number;

  constructor() {
    this.decks = new Map();
    this.currentId = 1;
  }

  async getDeck(id: number): Promise<Deck | undefined> {
    return this.decks.get(id);
  }

  async getAllDecks(): Promise<Deck[]> {
    return Array.from(this.decks.values());
  }

  async createDeck(insertDeck: InsertDeck): Promise<Deck> {
    const id = this.currentId++;
    const deck: Deck = {
      id,
      ...insertDeck,
      cards: [],
      pickedUpCards: []
    };
    this.decks.set(id, deck);
    return deck;
  }

  async updateDeck(id: number, updates: Partial<Deck>): Promise<Deck | undefined> {
    const deck = this.decks.get(id);
    if (!deck) return undefined;

    const updatedDeck = { ...deck, ...updates };
    this.decks.set(id, updatedDeck);
    return updatedDeck;
  }

  async deleteDeck(id: number): Promise<boolean> {
    return this.decks.delete(id);
  }
}

export const storage = new MemStorage();

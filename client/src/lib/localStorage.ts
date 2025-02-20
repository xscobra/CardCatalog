import type { Deck, DeckCard } from "@shared/schema";

const STORAGE_KEYS = {
  DECKS: 'mtg_decks',
  WISHLIST: 'mtg_wishlist',
} as const;

export function saveDecksToLocal(decks: Deck[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
  } catch (error) {
    console.error('Error saving decks to localStorage:', error);
  }
}

export function loadDecksFromLocal(): Deck[] {
  try {
    const decks = localStorage.getItem(STORAGE_KEYS.DECKS);
    return decks ? JSON.parse(decks) : [];
  } catch (error) {
    console.error('Error loading decks from localStorage:', error);
    return [];
  }
}

export function saveWishlistToLocal(cards: DeckCard[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(cards));
  } catch (error) {
    console.error('Error saving wishlist to localStorage:', error);
  }
}

export function loadWishlistFromLocal(): DeckCard[] {
  try {
    const wishlist = localStorage.getItem(STORAGE_KEYS.WISHLIST);
    return wishlist ? JSON.parse(wishlist) : [];
  } catch (error) {
    console.error('Error loading wishlist from localStorage:', error);
    return [];
  }
}

export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.DECKS);
    localStorage.removeItem(STORAGE_KEYS.WISHLIST);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

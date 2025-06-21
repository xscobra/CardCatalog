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
    const stored = localStorage.getItem(STORAGE_KEYS.DECKS);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    
    // Ensure all decks have required properties and fix any data structure issues
    return parsed.map(deck => ({
      id: deck.id || Date.now(),
      name: deck.name || 'Untitled Deck',
      format: deck.format || null,
      description: deck.description || null,
      cards: Array.isArray(deck.cards) ? deck.cards : [],
      pulledCards: Array.isArray(deck.pulledCards) ? deck.pulledCards : (Array.isArray(deck.pickedUpCards) ? deck.pickedUpCards : []),
    }));
  } catch (error) {
    console.error('Error loading decks from localStorage:', error);
    // Clear corrupted data and try legacy key
    localStorage.removeItem(STORAGE_KEYS.DECKS);
    try {
      const legacy = localStorage.getItem('mtg-decks');
      if (legacy) {
        const legacyParsed = JSON.parse(legacy);
        if (Array.isArray(legacyParsed)) {
          const migrated = legacyParsed.map(deck => ({
            id: deck.id || Date.now(),
            name: deck.name || 'Untitled Deck',
            format: deck.format || null,
            description: deck.description || null,
            cards: Array.isArray(deck.cards) ? deck.cards : [],
            pulledCards: Array.isArray(deck.pulledCards) ? deck.pulledCards : (Array.isArray(deck.pickedUpCards) ? deck.pickedUpCards : []),
          }));
          localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(migrated));
          localStorage.removeItem('mtg-decks');
          return migrated;
        }
      }
    } catch (legacyError) {
      console.error('Error migrating legacy data:', legacyError);
    }
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

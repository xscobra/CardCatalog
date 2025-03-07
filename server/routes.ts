import { Router } from "express";
import { storage } from "./storage";
import { insertDeckSchema, insertSharedDeckSchema } from "@shared/schema";
import type { Express } from "express";
import { createServer } from "http";
import { nanoid } from 'nanoid';

export async function registerRoutes(app: Express) {
  const api = Router();

  // Deck routes
  api.get("/decks", async (req, res) => {
    const decks = await storage.getAllDecks();
    res.json(decks);
  });

  api.get("/decks/:id", async (req, res) => {
    const deck = await storage.getDeck(Number(req.params.id));
    if (!deck) {
      res.status(404).json({ message: "Deck not found" });
      return;
    }
    res.json(deck);
  });

  api.post("/decks", async (req, res) => {
    const result = insertDeckSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid deck data", errors: result.error });
      return;
    }
    const deck = await storage.createDeck(result.data);
    res.json(deck);
  });

  api.patch("/decks/:id", async (req, res) => {
    const deck = await storage.updateDeck(Number(req.params.id), req.body);
    if (!deck) {
      res.status(404).json({ message: "Deck not found" });
      return;
    }
    res.json(deck);
  });

  api.delete("/decks/:id", async (req, res) => {
    const success = await storage.deleteDeck(Number(req.params.id));
    if (!success) {
      res.status(404).json({ message: "Deck not found" });
      return;
    }
    res.json({ success: true });
  });

  // Shared deck routes
  api.post("/decks/:id/share", async (req, res) => {
    const deckId = Number(req.params.id);
    const deck = await storage.getDeck(deckId);

    if (!deck) {
      res.status(404).json({ message: "Deck not found" });
      return;
    }

    // Generate a unique 8-character share code
    const shareCode = nanoid(8);

    const sharedDeck = await storage.createSharedDeck({
      shareCode,
      deckId,
      name: deck.name,
      description: deck.description,
      format: deck.format,
      cards: deck.cards
    });

    res.json({ shareCode: sharedDeck.shareCode });
  });

  api.get("/shared/:code", async (req, res) => {
    const sharedDeck = await storage.getSharedDeck(req.params.code);

    if (!sharedDeck) {
      res.status(404).json({ message: "Shared deck not found" });
      return;
    }

    if (!sharedDeck.isActive) {
      res.status(410).json({ message: "This shared deck is no longer available" });
      return;
    }

    // Increment view count
    await storage.incrementSharedDeckViews(sharedDeck.id);

    res.json(sharedDeck);
  });

  // Price history routes
  api.get("/cards/:cardId/price-history", async (req, res) => {
    const { cardId } = req.params;
    const days = req.query.days ? parseInt(req.query.days as string) : undefined;
    const history = await storage.getPriceHistory(cardId, days);
    res.json(history);
  });

  // Price alerts routes
  api.get("/price-alerts", async (req, res) => {
    const { cardId } = req.query;
    const alerts = await storage.getPriceAlerts(cardId as string | undefined);
    res.json(alerts);
  });

  api.post("/price-alerts", async (req, res) => {
    try {
      const alert = await storage.createPriceAlert(req.body);
      res.json(alert);
    } catch (error) {
      res.status(400).json({ message: "Invalid alert data" });
    }
  });

  api.patch("/price-alerts/:id", async (req, res) => {
    const alert = await storage.updatePriceAlert(Number(req.params.id), req.body);
    if (!alert) {
      res.status(404).json({ message: "Alert not found" });
      return;
    }
    res.json(alert);
  });

  // Card metadata routes
  api.get("/cards/metadata/:cardId", async (req, res) => {
    const metadata = await storage.getCardMetadata(req.params.cardId);
    if (!metadata) {
      res.status(404).json({ message: "Card metadata not found" });
      return;
    }
    res.json(metadata);
  });

  api.get("/cards/format/:format", async (req, res) => {
    const cards = await storage.getCardsByFormat(req.params.format);
    res.json(cards);
  });

  // Wishlist routes
  api.get("/wishlist", async (req, res) => {
    const cards = await storage.getWishlistCards();
    res.json(cards);
  });

  api.put("/wishlist", async (req, res) => {
    const cards = await storage.updateWishlistCards(req.body);
    res.json(cards);
  });

  app.use("/api", api);
  return createServer(app);
}
import { Router } from "express";
import { storage } from "./storage";
import { insertDeckSchema } from "@shared/schema";
import type { Express } from "express";
import { createServer } from "http";

export async function registerRoutes(app: Express) {
  const api = Router();

  // External deck import endpoint
  api.post("/import/deck", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const cleanUrl = url.trim();
      let deckData = null;

      // Moxfield API
      if (cleanUrl.includes('moxfield.com')) {
        const deckIdMatch = cleanUrl.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/);
        if (deckIdMatch) {
          const deckId = deckIdMatch[1];
          
          try {
            const response = await fetch(`https://api2.moxfield.com/v2/decks/all/${deckId}`, {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'MTG-Deck-Builder/1.0'
              }
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const mainboard = data.mainboard || data.boards?.mainboard || {};
            const cardList = Object.entries(mainboard)
              .map(([cardId, cardInfo]: [string, any]) => {
                const quantity = cardInfo.quantity || cardInfo.count || 1;
                const name = cardInfo.card?.name || cardInfo.name || 'Unknown Card';
                return `${quantity} ${name}`;
              })
              .join('\n');
            
            deckData = { 
              name: data.name || data.title || 'Moxfield Deck', 
              cardList 
            };
          } catch (error) {
            console.error('Moxfield import error:', error);
            return res.status(500).json({ error: 'Failed to fetch Moxfield deck' });
          }
        }
      }
      


      if (!deckData) {
        return res.status(400).json({ error: 'Unsupported deck URL. Only Moxfield URLs are supported.' });
      }

      res.json(deckData);
    } catch (error) {
      console.error('Deck import error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

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
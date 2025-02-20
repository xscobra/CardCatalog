import { Router } from "express";
import { storage } from "./storage";
import { insertDeckSchema } from "@shared/schema";
import type { Express } from "express";
import { createServer } from "http";

export async function registerRoutes(app: Express) {
  const api = Router();

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

  app.use("/api", api);
  return createServer(app);
}

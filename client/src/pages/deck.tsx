import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { CardSearch } from "@/components/card-search";
import { DeckList } from "@/components/deck-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Download, Upload } from "lucide-react";
import type { Deck, DeckCard } from "@shared/schema";

export default function DeckPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");

  const { data: deck } = useQuery<Deck>({
    queryKey: [`/api/decks/${id}`],
    enabled: id !== "new"
  });

  const updateDeck = useMutation({
    mutationFn: (updates: Partial<Deck>) =>
      apiRequest("PATCH", `/api/decks/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${id}`] });
    }
  });

  const createDeck = useMutation({
    mutationFn: (data: Partial<Deck>) =>
      apiRequest("POST", "/api/decks", data),
    onSuccess: async (response) => {
      const newDeck = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setLocation(`/deck/${newDeck.id}`);
    }
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (id === "new") {
      // Auto-save new deck when name is entered
      createDeck.mutate({ name: e.target.value });
    } else {
      updateDeck.mutate({ name: e.target.value });
    }
  };

  const handleCardMove = (card: DeckCard, toPickedUp: boolean) => {
    if (!deck) return;

    const newCards = deck.cards.filter((c) => c.id !== card.id);
    const newPickedUp = deck.pickedUpCards.filter((c) => c.id !== card.id);

    if (toPickedUp) {
      newPickedUp.push(card);
    } else {
      newCards.push(card);
    }

    updateDeck.mutate({ cards: newCards, pickedUpCards: newPickedUp });
  };

  const exportDeck = () => {
    if (!deck) return;
    const text = deck.cards
      .map((card) => `${card.name} (${card.sets.map((s) => s.name).join(", ")})`)
      .join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deck.name}.txt`;
    a.click();
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8 space-y-4">
        <Input
          placeholder="Deck Name"
          value={name}
          onChange={handleNameChange}
          className="text-2xl font-bold"
        />

        <div className="flex gap-4">
          <Button onClick={exportDeck} disabled={!deck}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button disabled={!deck}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <CardSearch
            onCardSelect={(card) => {
              if (!deck) return;
              updateDeck.mutate({
                cards: [...deck.cards, card]
              });
            }}
          />
        </div>

        <div>
          <DeckList
            cards={deck?.cards || []}
            pickedUpCards={deck?.pickedUpCards || []}
            onCardMove={handleCardMove}
          />
        </div>
      </div>
    </div>
  );
}
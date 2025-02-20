import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { CardSearch } from "@/components/card-search";
import { DeckList } from "@/components/deck-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { DeckCard } from "@shared/schema";

export default function DeckPage() {
  const { id } = useParams();
  const [name, setName] = useState("");
  
  const { data: deck } = useQuery({
    queryKey: [`/api/decks/${id}`],
    enabled: id !== "new"
  });

  const updateDeck = useMutation({
    mutationFn: (updates: any) =>
      apiRequest("PATCH", `/api/decks/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${id}`] });
    }
  });

  const createDeck = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/decks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
    }
  });

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
          onChange={(e) => setName(e.target.value)}
          className="text-2xl font-bold"
        />
        
        <div className="flex gap-4">
          <Button onClick={exportDeck}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
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

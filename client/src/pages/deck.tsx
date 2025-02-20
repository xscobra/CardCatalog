import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { CardSearch } from "@/components/card-search";
import { DeckList } from "@/components/deck-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { Download, Upload, ArrowLeft, Trash2 } from "lucide-react";
import type { Deck, DeckCard } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function DeckPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const { data: deck } = useQuery<Deck>({
    queryKey: [`/api/decks/${id}`],
    enabled: id !== "new"
  });

  // Set name when deck is loaded
  useEffect(() => {
    if (deck) {
      setName(deck.name);
    }
  }, [deck]);

  const updateDeck = useMutation({
    mutationFn: (updates: Partial<Deck>) =>
      apiRequest("PATCH", `/api/decks/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${id}`] });
      toast({
        title: "Deck Updated",
        description: "Your changes have been saved."
      });
    }
  });

  const createDeck = useMutation({
    mutationFn: (data: Partial<Deck>) =>
      apiRequest("POST", "/api/decks", data),
    onSuccess: async (response) => {
      const newDeck = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setLocation(`/deck/${newDeck.id}`);
      toast({
        title: "Deck Created",
        description: "Your new deck has been created successfully."
      });
    }
  });

  const deleteDeck = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/decks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setLocation("/");
      toast({
        title: "Deck Deleted",
        description: "The deck has been deleted successfully."
      });
    }
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);

    if (newName.length < 1) return;

    if (id === "new") {
      createDeck.mutate({ name: newName });
    } else {
      updateDeck.mutate({ name: newName });
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
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Deck Name"
            value={name}
            onChange={handleNameChange}
            className="text-2xl font-bold"
            disabled={createDeck.isPending}
          />
          {id !== "new" && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="p-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your deck
              and all its cards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteDeck.mutate();
                setShowDeleteDialog(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
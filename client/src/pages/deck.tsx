import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { CardSearch } from "@/components/card-search";
import { DeckList } from "@/components/deck-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { Download, Upload, ArrowLeft, Trash2 } from "lucide-react";
import type { Deck, DeckCard } from "@shared/schema";
import type { ScryfallCard } from "@/lib/api";
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

const FORMATS = [
  { value: "standard", label: "Standard" },
  { value: "modern", label: "Modern" },
  { value: "commander", label: "Commander" },
  { value: "pioneer", label: "Pioneer" },
  { value: "legacy", label: "Legacy" },
  { value: "vintage", label: "Vintage" },
  { value: "pauper", label: "Pauper" },
];

export default function DeckPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const { data: deck } = useQuery<Deck>({
    queryKey: [`/api/decks/${id}`],
    enabled: id !== "new"
  });

  useEffect(() => {
    if (deck) {
      setName(deck.name);
      setDebouncedName(deck.name);
    }
  }, [deck]);

  // Debounce the name changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedName(name);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [name]);

  // Only create/update deck when debouncedName changes
  useEffect(() => {
    if (debouncedName.length < 1) return;

    if (id === "new") {
      createDeck.mutate({ name: debouncedName });
    } else if (deck && debouncedName !== deck.name) {
      updateDeck.mutate({ name: debouncedName });
    }
  }, [debouncedName, id, deck]);

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
    setName(e.target.value);
  };

  const handleFormatChange = (format: string) => {
    updateDeck.mutate({ format });
  };

  const transformScryfallCard = (card: ScryfallCard): DeckCard => {
    return {
      id: card.id,
      name: card.name,
      sets: [{
        code: card.set,
        name: card.set_name,
        symbol: `https://svgs.scryfall.io/sets/${card.set}.svg`,
      }],
      prices: {
        tcgplayer: card.prices.usd ? parseFloat(card.prices.usd) : null,
        cardkingdom: card.prices.usd_foil ? parseFloat(card.prices.usd_foil) : null,
      },
      imageUrl: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || "",
    };
  };

  const handleCardMove = (card: DeckCard, toPickedUp: boolean) => {
    if (!deck) return;

    let newCards = [...deck.cards];
    let newPickedUp = [...deck.pickedUpCards];

    // Remove the card from both lists first
    newCards = newCards.filter((c) => c.id !== card.id);
    newPickedUp = newPickedUp.filter((c) => c.id !== card.id);

    // Only add to the destination list if we're moving (not removing)
    if (toPickedUp) {
      newPickedUp.push(card);
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

  const handleCardSelect = (card: ScryfallCard) => {
    if (!deck) {
      if (!name.trim()) {
        toast({
          title: "Name Required",
          description: "Please name your deck before adding cards.",
          variant: "destructive"
        });
        return;
      }
      return;
    }
    const transformedCard = transformScryfallCard(card);
    updateDeck.mutate({
      cards: [...deck.cards, transformedCard]
    });
  };

  // Calculate total prices for the deck
  const calculateTotalPrices = () => {
    if (!deck) return { tcgplayer: 0, cardkingdom: 0 };

    return [...deck.cards, ...deck.pickedUpCards].reduce(
      (totals, card) => ({
        tcgplayer: totals.tcgplayer + (card.prices.tcgplayer || 0),
        cardkingdom: totals.cardkingdom + (card.prices.cardkingdom || 0),
      }),
      { tcgplayer: 0, cardkingdom: 0 }
    );
  };

  const { tcgplayer: totalTcg, cardkingdom: totalCk } = calculateTotalPrices();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 min-h-screen">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 w-full sm:w-auto">
            <Input
              placeholder="Deck Name"
              value={name}
              onChange={handleNameChange}
              className="text-xl sm:text-2xl font-bold"
            />
          </div>
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

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportDeck} disabled={!deck} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button disabled={!deck} className="w-full sm:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </div>

          {deck && (
            <Select
              value={deck.format || ""}
              onValueChange={handleFormatChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Format" />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <CardSearch
            onCardSelect={handleCardSelect}
          />
        </div>

        <div className="order-1 lg:order-2">
          <DeckList
            cards={deck?.cards || []}
            pickedUpCards={deck?.pickedUpCards || []}
            onCardMove={handleCardMove}
            format={deck?.format}
            totalPrices={{ tcgplayer: totalTcg, cardkingdom: totalCk }}
          />
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="sm:max-w-[425px]">
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
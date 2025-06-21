import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { CardSearch } from "@/components/card-search";
import { DeckList } from "@/components/deck-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Download, ArrowLeft, Trash2, Upload } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Deck, DeckCard } from "@shared/schema";
import type { ScryfallCard } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { DeckExportDialog } from "@/components/deck-export-dialog";
import { DeckImportDialog } from "@/components/deck-import-dialog";
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
import { loadDecksFromLocal, saveDecksToLocal } from "@/lib/localStorage";



export default function DeckPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [deck, setDeck] = useState<Deck | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id === "new") return;

    const decks = loadDecksFromLocal();
    const foundDeck = decks.find(d => d.id === Number(id));
    if (foundDeck) {
      setDeck(foundDeck);
      setName(foundDeck.name);
    }
  }, [id]);

  const saveDeck = (updatedDeck: Deck) => {
    const decks = loadDecksFromLocal();
    const index = decks.findIndex(d => d.id === updatedDeck.id);

    if (index >= 0) {
      decks[index] = updatedDeck;
    } else {
      decks.push(updatedDeck);
    }

    saveDecksToLocal(decks);
    setDeck(updatedDeck);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (deck) {
      const updatedDeck = { ...deck, name: e.target.value };
      saveDeck(updatedDeck);
    }
  };



  const handleDeleteDeck = () => {
    const decks = loadDecksFromLocal();
    const updatedDecks = decks.filter(d => d.id !== Number(id));
    saveDecksToLocal(updatedDecks);
    setLocation("/");
    toast({
      title: "Deck Deleted",
      description: "The deck has been deleted successfully."
    });
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

      // Create new deck
      const decks = loadDecksFromLocal();
      const newDeck: Deck = {
        id: Date.now(),
        name,
        format: null,
        description: null,
        cards: [transformScryfallCard(card)],
        pulledCards: [],
      };
      saveDeck(newDeck);
      setLocation(`/deck/${newDeck.id}`);
      return;
    }

    const transformedCard = transformScryfallCard(card);
    const updatedDeck = {
      ...deck,
      cards: [...deck.cards, transformedCard]
    };
    saveDeck(updatedDeck);
  };

  const handleCardMove = (card: DeckCard, remove: boolean) => {
    if (!deck) return;

    if (remove) {
      // Removing card completely from deck
      const updatedDeck = {
        ...deck,
        cards: deck.cards.filter((c) => c.id !== card.id)
      };
      saveDeck(updatedDeck);
    }
  };

  const handleCardPull = (card: DeckCard) => {
    if (!deck) return;

    const updatedDeck = { 
      ...deck,
      cards: deck.cards.filter(c => c.id !== card.id),
      pulledCards: [...(deck.pulledCards || []), card]
    };

    saveDeck(updatedDeck);
  };

  const handleUpdatePulledCard = (cardId: string, selectedSet: DeckCard["selectedSet"]) => {
    if (!deck) return;

    const updatedDeck = {
      ...deck,
      pulledCards: (deck.pulledCards || []).map(card => 
        card.id === cardId ? { ...card, selectedSet } : card
      )
    };

    saveDeck(updatedDeck);
  };

  const handleRemovePulledCard = (cardId: string) => {
    if (!deck) return;

    const updatedDeck = {
      ...deck,
      pulledCards: (deck.pulledCards || []).filter(card => card.id !== cardId)
    };

    saveDeck(updatedDeck);
  };

  const handlePriceUpdate = (cardId: string, newPrices: { tcgplayer: number | null; cardkingdom: number | null }) => {
    if (!deck) return;

    try {
      const updateCardInList = (list: DeckCard[]) =>
        list.map((card) =>
          card.id === cardId
            ? { ...card, prices: newPrices }
            : card
        );

      const newCards = updateCardInList(deck.cards || []);
      const newPulledCards = updateCardInList(deck.pulledCards || []);

      const updatedDeck = {
        ...deck,
        cards: newCards,
        pulledCards: newPulledCards
      };
      saveDeck(updatedDeck);
    } catch (error) {
      console.error('Error updating prices:', error);
      toast({
        title: "Error",
        description: "Failed to update card prices",
        variant: "destructive",
      });
    }
  };

  const handleExportClick = () => {
    if (!deck) return;
    setShowExportDialog(true);
  };

  const handleImportCards = (deckName: string, cards: DeckCard[]) => {
    try {
      if (!deck) {
        // Create new deck if none exists
        const decks = loadDecksFromLocal();
        const newDeck: Deck = {
          id: Date.now(),
          name: deckName,
          format: null,
          description: null,
          cards: cards,
          pulledCards: [],
        };
        saveDeck(newDeck);
        setName(deckName);
        setDeck(newDeck);
        
        // Don't navigate if we're already on a new deck page
        if (id === "new") {
          // Update the URL to reflect the new deck ID
          setLocation(`/deck/${newDeck.id}`);
        }
      } else {
        // Add cards to existing deck
        const updatedDeck = {
          ...deck,
          cards: [...deck.cards, ...cards]
        };
        saveDeck(updatedDeck);
        setDeck(updatedDeck);
      }
      
      toast({
        title: "Cards Imported",
        description: `Successfully imported ${cards.length} cards`,
      });
      
      // Close the import dialog
      setShowImportDialog(false);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Error",
        description: "Failed to import cards. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate total prices from pulled cards only
  const calculateTotalPrices = () => {
    if (!deck) return { tcgplayer: 0, cardkingdom: 0 };

    try {
      const pulledCards = deck.pulledCards || [];
      return pulledCards.reduce(
        (totals, card) => {
          const tcgPrice = card.selectedSet?.prices?.tcgplayer || card.prices.tcgplayer || 0;
          const ckPrice = card.selectedSet?.prices?.cardkingdom || card.prices.cardkingdom || 0;
          return {
            tcgplayer: totals.tcgplayer + tcgPrice,
            cardkingdom: totals.cardkingdom + ckPrice,
          };
        },
        { tcgplayer: 0, cardkingdom: 0 }
      );
    } catch (error) {
      console.error('Error calculating total prices:', error);
      return { tcgplayer: 0, cardkingdom: 0 };
    }
  };

  const { tcgplayer: totalTcg, cardkingdom: totalCk } = calculateTotalPrices();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/")}
              className="p-2 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 w-full sm:w-auto">
              <Input
                placeholder="Deck Name"
                value={name}
                onChange={handleNameChange}
                className="text-xl sm:text-2xl font-bold border-0 bg-transparent focus:bg-card/50 transition-all shadow-none focus:shadow-md"
              />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {id !== "new" && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="p-2 hover:shadow-lg transition-shadow"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button 
              onClick={handleExportClick} 
              disabled={!deck} 
              className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button 
              onClick={() => setShowImportDialog(true)} 
              className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow"
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </div>


        </div>
      </div>

      <div className="mt-8 grid gap-8 grid-cols-1 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <CardSearch
            onCardSelect={handleCardSelect}
          />
        </div>

        <div className="order-1 lg:order-2">
          <DeckList
            cards={deck?.cards || []}
            pulledCards={deck?.pulledCards || []}
            onCardMove={handleCardMove}
            onCardPull={handleCardPull}
            onUpdatePulledCard={handleUpdatePulledCard}
            onRemovePulledCard={handleRemovePulledCard}
            format={deck?.format || undefined}
            totalPrices={{ tcgplayer: totalTcg, cardkingdom: totalCk }}
            onPriceUpdate={handlePriceUpdate}
          />
        </div>
      </div>

      <DeckExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        deckName={deck?.name || "Untitled Deck"}
        cards={deck?.cards || []}
        pulledCards={deck?.pulledCards || []}
      />

      <DeckImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImportCards}
      />

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
                handleDeleteDeck();
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
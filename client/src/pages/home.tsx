import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Deck, DeckCard } from "@shared/schema";
import { WishlistSection } from "@/components/wishlist-section";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { loadDecksFromLocal, saveDecksToLocal } from "@/lib/localStorage";

export default function Home() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Load decks from localStorage on component mount
    const savedDecks = loadDecksFromLocal();
    setDecks(savedDecks);
  }, []);

  const handleDeleteDeck = (deck: Deck) => {
    const updatedDecks = decks.filter((d) => d.id !== deck.id);
    setDecks(updatedDecks);
    saveDecksToLocal(updatedDecks);
    setDeckToDelete(null);
    toast({
      title: "Deck Deleted",
      description: "The deck has been deleted successfully."
    });
  };

  const handleImportDeck = (deckName: string, cards: DeckCard[]) => {
    const newDeck: Deck = {
      id: Date.now(),
      name: deckName,
      format: "standard",
      cards: cards,
      pickedUpCards: [],
      pulledCards: [],
    };

    const updatedDecks = [...decks, newDeck];
    setDecks(updatedDecks);
    saveDecksToLocal(updatedDecks);
    
    // Navigate to the new deck
    setLocation(`/deck/${newDeck.id}`);
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">My Deck Lists</h1>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Deck
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link href="/deck/new" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Empty Deck
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import Card List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {decks.map((deck) => (
          <Card key={deck.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>{deck.name}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  setDeckToDelete(deck);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Link href={`/deck/${deck.id}`}>
                <p className="text-sm text-muted-foreground">
                  {deck.cards.length} cards ({deck.pickedUpCards.length} picked up)
                </p>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <WishlistSection />

      <DeckImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImportDeck}
      />

      <AlertDialog
        open={!!deckToDelete}
        onOpenChange={(open) => !open && setDeckToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your deck
              "{deckToDelete?.name}" and all its cards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deckToDelete) {
                  handleDeleteDeck(deckToDelete);
                }
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
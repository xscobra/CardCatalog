import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { searchCards, type ScryfallCard } from "@/lib/api";
import { Loader2, Upload, AlertCircle } from "lucide-react";
import type { DeckCard } from "@shared/schema";

interface DeckImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (deckName: string, cards: DeckCard[]) => void;
}

export function DeckImportDialog({
  open,
  onOpenChange,
  onImport,
}: DeckImportDialogProps) {
  const [deckName, setDeckName] = useState("");
  const [cardList, setCardList] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const parseCardList = (text: string): Array<{ quantity: number; name: string }> => {
    const lines = text.trim().split("\n").filter(line => line.trim());
    const parsedCards: Array<{ quantity: number; name: string }> = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Match patterns like "4 Lightning Bolt" or "1x Counterspell" or just "Lightning Bolt"
      const quantityMatch = trimmedLine.match(/^(\d+)x?\s+(.+)$/);
      
      if (quantityMatch) {
        const quantity = parseInt(quantityMatch[1]);
        const name = quantityMatch[2].trim();
        parsedCards.push({ quantity, name });
      } else {
        // Default to 1 if no quantity specified
        parsedCards.push({ quantity: 1, name: trimmedLine });
      }
    }

    return parsedCards;
  };

  const transformScryfallCard = (card: ScryfallCard): DeckCard => {
    return {
      id: card.id,
      name: card.name,
      sets: [{
        code: card.set,
        name: card.set_name,
        symbol: `https://svgs.scryfall.io/sets/${card.set}.svg`
      }],
      prices: {
        tcgplayer: card.prices.usd ? parseFloat(card.prices.usd) : null,
        cardkingdom: card.prices.usd_foil ? parseFloat(card.prices.usd_foil) : null,
      },
      imageUrl: card.image_uris?.normal || (card.card_faces?.[0]?.image_uris?.normal ?? "")
    };
  };

  const handleImport = async () => {
    if (!deckName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a deck name",
        variant: "destructive",
      });
      return;
    }

    if (!cardList.trim()) {
      toast({
        title: "Error",
        description: "Please enter a card list",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportErrors([]);

    try {
      const parsedCards = parseCardList(cardList);
      const importedCards: DeckCard[] = [];
      const errors: string[] = [];

      for (const { quantity, name } of parsedCards) {
        try {
          // Search for the card
          const searchResults = await searchCards(name);
          
          if (searchResults.length === 0) {
            errors.push(`Card not found: ${name}`);
            continue;
          }

          // Use the first result (best match)
          const card = searchResults[0];
          const deckCard = transformScryfallCard(card);

          // Add multiple copies based on quantity
          for (let i = 0; i < quantity; i++) {
            importedCards.push({ ...deckCard, id: `${card.id}-${Date.now()}-${i}` });
          }
        } catch (error) {
          errors.push(`Error importing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setImportErrors(errors);

      if (importedCards.length > 0) {
        onImport(deckName.trim(), importedCards);
        toast({
          title: "Import Successful",
          description: `Imported ${importedCards.length} cards${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        });
        
        // Reset form
        setDeckName("");
        setCardList("");
        onOpenChange(false);
      } else {
        toast({
          title: "Import Failed",
          description: "No cards could be imported",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "An error occurred during import",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open && !isImporting) {
      setDeckName("");
      setCardList("");
      setImportErrors([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Deck</DialogTitle>
          <DialogDescription>
            Create a new deck by importing a card list. Enter card names with quantities (e.g., "4 Lightning Bolt" or "1x Counterspell").
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="deck-name">Deck Name</Label>
            <Input
              id="deck-name"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Enter deck name..."
              disabled={isImporting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="card-list">Card List</Label>
            <Textarea
              id="card-list"
              value={cardList}
              onChange={(e) => setCardList(e.target.value)}
              placeholder={`4 Lightning Bolt
2 Counterspell
1 Mox Ruby
3x Force of Will
Black Lotus`}
              rows={12}
              disabled={isImporting}
            />
          </div>

          {importErrors.length > 0 && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  Import Errors ({importErrors.length})
                </span>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {importErrors.map((error, index) => (
                  <p key={index} className="text-xs text-destructive/80">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting}>
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Upload className="mr-2 h-4 w-4" />
            Import Deck
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
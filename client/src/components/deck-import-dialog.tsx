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
import { Loader2, Upload, AlertCircle, Link, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [deckUrl, setDeckUrl] = useState("");
  const [importMode, setImportMode] = useState<"text" | "url">("text");
  const [isImporting, setIsImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const parseCardList = (text: string): Array<{ quantity: number; name: string }> => {
    const lines = text.trim().split("\n").filter(line => line.trim());
    const parsedCards: Array<{ quantity: number; name: string }> = [];

    for (const line of lines) {
      let trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Skip section headers and comments
      if (trimmedLine.startsWith('//') || 
          trimmedLine.toLowerCase().includes('sideboard') ||
          trimmedLine.toLowerCase().includes('maybeboard') ||
          trimmedLine.toLowerCase().includes('commander') ||
          trimmedLine.toLowerCase().includes('companion')) continue;

      // Match various formats: "4 Lightning Bolt", "1x Counterspell", "Lightning Bolt (M10)", etc.
      const quantityMatch = trimmedLine.match(/^(\d+)x?\s+(.+?)(?:\s*\([^)]*\))?\s*$/);
      
      if (quantityMatch) {
        const quantity = parseInt(quantityMatch[1]);
        let name = quantityMatch[2].trim();
        
        // Clean up card name - remove trailing set info, collector numbers, etc.
        name = name.replace(/\s*\([^)]*\)\s*$/, ''); // Remove (SET)
        name = name.replace(/\s*\d+\/\d+\s*$/, ''); // Remove collector numbers like 123/249
        name = name.replace(/\s*#\d+\s*$/, ''); // Remove #123 format
        name = name.trim();
        
        if (name) {
          parsedCards.push({ quantity, name });
        }
      } else {
        // No quantity specified, try to extract card name
        let nameOnly = trimmedLine.replace(/\s*\([^)]*\)\s*$/, '').trim();
        nameOnly = nameOnly.replace(/\s*\d+\/\d+\s*$/, '');
        nameOnly = nameOnly.replace(/\s*#\d+\s*$/, '');
        nameOnly = nameOnly.trim();
        
        if (nameOnly) {
          parsedCards.push({ quantity: 1, name: nameOnly });
        }
      }
    }

    return parsedCards;
  };

  const fetchDeckFromUrl = async (url: string): Promise<{ name: string; cardList: string }> => {
    const cleanUrl = url.trim();
    
    try {
      // Use our server-side endpoint to bypass CORS
      const response = await fetch('/api/import/deck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: cleanUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Deck import error:', error);
      
      // Provide specific error messages based on the URL
      if (cleanUrl.includes('moxfield.com')) {
        throw new Error('Failed to fetch Moxfield deck. Please copy the deck list manually from the "Export" section.');
      } else if (cleanUrl.includes('mtggoldfish.com')) {
        throw new Error('Failed to fetch MTGGoldfish deck. Please use the "Export" → "Text" option and paste manually.');
      } else if (cleanUrl.includes('archidekt.com')) {
        throw new Error('Failed to fetch Archidekt deck. Please copy the deck list manually from the deck page.');
      } else if (cleanUrl.includes('tappedout.net')) {
        throw new Error('For TappedOut decks, please copy the deck list using the "Text" export option and paste it in the Text Import tab');
      } else {
        throw new Error('Unsupported deck URL. Supported sites: Moxfield, Archidekt, MTGGoldfish. For others, use the Text Import tab.');
      }
    }
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
    setIsImporting(true);
    setImportErrors([]);

    try {
      let finalDeckName = deckName.trim();
      let finalCardList = cardList.trim();

      // Handle URL import
      if (importMode === "url") {
        if (!deckUrl.trim()) {
          toast({
            title: "Error",
            description: "Please enter a deck URL",
            variant: "destructive",
          });
          setIsImporting(false);
          return;
        }

        const { name, cardList: fetchedCardList } = await fetchDeckFromUrl(deckUrl);
        finalDeckName = finalDeckName || name;
        finalCardList = fetchedCardList;
      }

      // Validate inputs
      if (!finalDeckName) {
        toast({
          title: "Error",
          description: "Please enter a deck name",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      if (!finalCardList) {
        toast({
          title: "Error",
          description: importMode === "url" ? "No cards found in the deck URL" : "Please enter a card list",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      const parsedCards = parseCardList(finalCardList);
      const importedCards: DeckCard[] = [];
      const errors: string[] = [];

      // Group cards by name to handle duplicates properly
      const cardGroups = new Map<string, number>();
      for (const { quantity, name } of parsedCards) {
        const existing = cardGroups.get(name) || 0;
        cardGroups.set(name, existing + quantity);
      }

      for (const [name, totalQuantity] of cardGroups) {
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

          // Add all copies based on total quantity (including duplicates)
          for (let i = 0; i < totalQuantity; i++) {
            importedCards.push({ 
              ...deckCard, 
              id: `${card.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}` 
            });
          }
        } catch (error) {
          errors.push(`Error importing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setImportErrors(errors);

      if (importedCards.length > 0) {
        try {
          onImport(finalDeckName, importedCards);
          
          toast({
            title: "Import Successful",
            description: `Imported ${importedCards.length} cards${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
          });
          
          // Reset form
          setDeckName("");
          setCardList("");
          setDeckUrl("");
          setImportErrors([]);
          onOpenChange(false);
        } catch (error) {
          console.error('Import callback error:', error);
          toast({
            title: "Import Error",
            description: error instanceof Error ? error.message : "Failed to import cards",
            variant: "destructive",
          });
        }
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
      setDeckUrl("");
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
            Import a deck from a URL (Moxfield, Archidekt, MTGGoldfish) or paste a card list directly.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="deck-name">Deck Name</Label>
            <Input
              id="deck-name"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Enter deck name (auto-filled from URL)..."
              disabled={isImporting}
            />
          </div>

          <Tabs value={importMode} onValueChange={(value) => setImportMode(value as "text" | "url")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                URL Import
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text Import
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="deck-url">Deck URL</Label>
                <Input
                  id="deck-url"
                  value={deckUrl}
                  onChange={(e) => setDeckUrl(e.target.value)}
                  placeholder="https://moxfield.com/decks/... or https://mtggoldfish.com/deck/..."
                  disabled={isImporting}
                />
                <p className="text-sm text-muted-foreground">
                  Supported: Moxfield, Archidekt, MTGGoldfish. For TappedOut, use "Text" export and paste in Text Import tab.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
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
                <p className="text-sm text-muted-foreground">
                  Enter card names with quantities. Supports various formats including set codes in parentheses.
                </p>
              </div>
            </TabsContent>
          </Tabs>

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
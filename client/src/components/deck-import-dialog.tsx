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
  const [importMode, setImportMode] = useState<"text" | "url" | "file">("text");
  const [isImporting, setIsImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    
    // Only support Moxfield URLs
    if (!cleanUrl.includes('moxfield.com')) {
      throw new Error('Only Moxfield URLs are supported. For other sites, use the File Upload or Text Import tabs.');
    }
    
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
      console.error('Moxfield import error:', error);
      throw new Error('Failed to fetch Moxfield deck. Please copy the deck list manually from the "Export" section.');
    }
  };

  const handleFileUpload = async (file: File): Promise<{ name: string; cardList: string }> => {
    const fileName = file.name.replace(/\.(txt|pdf)$/i, '');
    
    if (file.type === 'application/pdf') {
      // For PDF files, we'll need to extract text content
      // For now, show error message asking for text files
      throw new Error('PDF import is not yet supported. Please export your deck list as a .txt file and try again.');
    }
    
    // Handle text files
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text();
      return {
        name: fileName,
        cardList: text
      };
    }
    
    throw new Error('Unsupported file type. Please upload a .txt file with your deck list.');
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
            description: "Please enter a Moxfield deck URL",
            variant: "destructive",
          });
          setIsImporting(false);
          return;
        }

        try {
          const { name, cardList: fetchedCardList } = await fetchDeckFromUrl(deckUrl);
          finalDeckName = finalDeckName || name;
          finalCardList = fetchedCardList;
        } catch (error) {
          console.error('URL import failed:', error);
          toast({
            title: "Import Failed",
            description: error instanceof Error ? error.message : "Failed to import from URL",
            variant: "destructive",
          });
          setIsImporting(false);
          return;
        }
      }

      // Handle file import
      if (importMode === "file") {
        if (!selectedFile) {
          toast({
            title: "Error",
            description: "Please select a file to upload",
            variant: "destructive",
          });
          setIsImporting(false);
          return;
        }

        try {
          const { name, cardList: fetchedCardList } = await handleFileUpload(selectedFile);
          finalDeckName = finalDeckName || name;
          finalCardList = fetchedCardList;
        } catch (error) {
          console.error('File import failed:', error);
          toast({
            title: "Import Failed",
            description: error instanceof Error ? error.message : "Failed to import from file",
            variant: "destructive",
          });
          setIsImporting(false);
          return;
        }
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
          // Clean the card name for better search accuracy
          const cleanName = name.trim()
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[""]/g, '"') // Normalize quotes
            .toLowerCase();
          
          // Search for the card with improved accuracy
          const searchResults = await searchCards(cleanName);
          
          if (searchResults.length === 0) {
            // Try alternative search without normalization
            const alternativeResults = await searchCards(name.trim());
            if (alternativeResults.length === 0) {
              errors.push(`Card not found: ${name}`);
              continue;
            }
            searchResults.push(...alternativeResults);
          }

          // Use the first result (best match due to improved sorting)
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
          setSelectedFile(null);
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
      setSelectedFile(null);
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
            Import a deck from Moxfield URL, upload a .txt file, or paste a card list directly.
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

          <Tabs value={importMode} onValueChange={(value) => setImportMode(value as "text" | "url" | "file")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Moxfield
              </TabsTrigger>
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                File Upload
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text Import
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="deck-url">Moxfield Deck URL</Label>
                <Input
                  id="deck-url"
                  value={deckUrl}
                  onChange={(e) => setDeckUrl(e.target.value)}
                  placeholder="https://moxfield.com/decks/..."
                  disabled={isImporting}
                />
                <p className="text-sm text-muted-foreground">
                  Enter a Moxfield deck URL to automatically import the deck list and name.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="deck-file">Upload Deck File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="deck-file"
                    type="file"
                    accept=".txt,.pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    disabled={isImporting}
                    className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-muted file:text-muted-foreground"
                  />
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Upload a .txt file containing your deck list. PDF support coming soon.
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
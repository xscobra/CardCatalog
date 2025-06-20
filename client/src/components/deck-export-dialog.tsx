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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, FileImage } from "lucide-react";
import type { DeckCard } from "@shared/schema";

interface DeckExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckName: string;
  cards: DeckCard[];
  pulledCards: DeckCard[];
}

export function DeckExportDialog({
  open,
  onOpenChange,
  deckName,
  cards,
  pulledCards,
}: DeckExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<"txt" | "pdf">("txt");
  const { toast } = useToast();

  const generateCardList = (): string => {
    // Group remaining cards by name and count quantities
    const cardCounts = new Map<string, number>();
    
    cards.forEach(card => {
      const count = cardCounts.get(card.name) || 0;
      cardCounts.set(card.name, count + 1);
    });

    // Group pulled cards by name and count quantities
    const pulledCardCounts = new Map<string, number>();
    
    pulledCards.forEach(card => {
      const count = pulledCardCounts.get(card.name) || 0;
      pulledCardCounts.set(card.name, count + 1);
    });

    // Calculate pulled card prices total with custom pricing logic
    const pulledTotal = pulledCards.reduce((total, card) => {
      // Get card metadata to determine rarity - for now we'll use a simple approach
      // Common cards = $0.25, everything else rounded up to nearest $0.50 or dollar
      const basePrice = card.selectedSet?.prices.tcgplayer || card.selectedSet?.prices.cardkingdom || 0;
      
      let customPrice = 0;
      if (basePrice > 0) {
        // Assume common rarity for very low prices (under $0.50), everything else gets custom rounding
        if (basePrice < 0.50) {
          customPrice = 0.25; // Common rarity
        } else {
          // Round up to nearest $0.50 or dollar
          if (basePrice < 1.0) {
            customPrice = Math.ceil(basePrice * 2) / 2; // Round up to nearest $0.50
          } else {
            customPrice = Math.ceil(basePrice); // Round up to nearest dollar
          }
        }
      }
      
      return {
        tcgplayer: total.tcgplayer + customPrice,
        cardkingdom: total.cardkingdom + customPrice,
      };
    }, { tcgplayer: 0, cardkingdom: 0 });

    // Format remaining cards
    const remainingCardsList = Array.from(cardCounts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => `${count} ${name}`)
      .join('\n');

    // Format pulled cards with prices
    const pulledCardsList = Array.from(pulledCardCounts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => {
        const card = pulledCards.find(c => c.name === name);
        const basePrice = card?.selectedSet?.prices.tcgplayer || card?.selectedSet?.prices.cardkingdom || 0;
        
        let customPrice = 0;
        if (basePrice > 0) {
          // Common rarity pricing logic
          if (basePrice < 0.50) {
            customPrice = 0.25; // Common rarity
          } else {
            // Round up to nearest $0.50 or dollar
            if (basePrice < 1.0) {
              customPrice = Math.ceil(basePrice * 2) / 2; // Round up to nearest $0.50
            } else {
              customPrice = Math.ceil(basePrice); // Round up to nearest dollar
            }
          }
        }
        
        const priceInfo = customPrice > 0 ? ` ($${customPrice.toFixed(2)})` : '';
        return `${count} ${name}${priceInfo}`;
      })
      .join('\n');

    // Combine sections
    let result = '';
    
    if (remainingCardsList) {
      result += 'NOT PULLED:\n' + remainingCardsList + '\n\n';
    }
    
    if (pulledCardsList) {
      result += 'PULLED CARDS:\n' + pulledCardsList + '\n\n';
      result += `Pulled Cards Total: $${pulledTotal.tcgplayer.toFixed(2)}`;
    }

    return result.trim();
  };

  const exportToTxt = () => {
    const cardList = generateCardList();
    const content = `${deckName}\n${'='.repeat(deckName.length)}\n\n${cardList}\n\nTotal Remaining Cards: ${cards.length}\nTotal Pulled Cards: ${pulledCards.length}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${deckName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPdf = async () => {
    try {
      // Create a simple HTML structure for PDF generation
      const cardList = generateCardList();
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${deckName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              line-height: 1.6;
            }
            h1 {
              color: #333;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .card-list {
              white-space: pre-line;
              font-family: 'Courier New', monospace;
              background: #f5f5f5;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .summary {
              margin-top: 30px;
              padding: 15px;
              background: #e8f4f8;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <h1>${deckName}</h1>
          <div class="card-list">${cardList}</div>
          <div class="summary">
            <strong>Total Cards: ${cards.length}</strong><br>
            Exported on: ${new Date().toLocaleDateString()}
          </div>
        </body>
        </html>
      `;

      // Open the HTML in a new window for printing to PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait a moment for content to load, then trigger print dialog
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      toast({
        title: "Export Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    if (cards.length === 0 && pulledCards.length === 0) {
      toast({
        title: "No Cards to Export",
        description: "The deck list is empty.",
        variant: "destructive",
      });
      return;
    }

    if (exportFormat === "txt") {
      exportToTxt();
    } else {
      exportToPdf();
    }

    toast({
      title: "Export Started",
      description: `Exporting deck as ${exportFormat.toUpperCase()} file.`,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Deck</DialogTitle>
          <DialogDescription>
            Export "{deckName}" card list in your preferred format.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-3">
            <Label>Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(value: "txt" | "pdf") => setExportFormat(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="txt" id="txt" />
                <Label htmlFor="txt" className="flex items-center cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  Text File (.txt) - Simple card list
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center cursor-pointer">
                  <FileImage className="mr-2 h-4 w-4" />
                  PDF File (.pdf) - Formatted document
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Remaining cards:</strong> {cards.length}<br/>
              <strong>Pulled cards:</strong> {pulledCards.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Export includes remaining deck cards and pulled cards with custom pricing:<br/>
              • Common rarity cards: $0.25<br/>
              • Other cards: Rounded up to nearest $0.50 or dollar
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export {exportFormat.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
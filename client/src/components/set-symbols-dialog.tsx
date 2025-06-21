import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getCardPrints, getSetSymbolUrl, getCardImageUrl } from "@/lib/api";
import { Loader2, ArrowLeft } from "lucide-react";
import { useState } from "react";

interface SetSymbolsDialogProps {
  cardName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetSymbolsDialog({
  cardName,
  open,
  onOpenChange,
}: SetSymbolsDialogProps) {
  const [selectedCard, setSelectedCard] = useState<any>(null);
  
  const { data: prints, isLoading } = useQuery({
    queryKey: ["prints", cardName],
    queryFn: () => getCardPrints(cardName),
    enabled: open
  });

  const uniqueSets = prints ? Array.from(new Set(prints.map(print => print.set))).map(setCode => {
    const print = prints.find(p => p.set === setCode);
    return {
      code: setCode,
      name: print?.set_name || "",
      symbol: getSetSymbolUrl(setCode),
      card: print
    };
  }).filter(set => set.name && set.symbol) : [];

  const handleSetClick = (set: any) => {
    setSelectedCard(set.card);
  };

  const handleBackToSets = () => {
    setSelectedCard(null);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedCard(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[600px]">
        {selectedCard ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={handleBackToSets}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Sets
              </Button>
            </div>
            <DialogTitle>{selectedCard.name}</DialogTitle>
            <DialogDescription>
              {selectedCard.set_name} ({selectedCard.set.toUpperCase()})
            </DialogDescription>
            <div className="flex justify-center mt-4">
              <img
                src={getCardImageUrl(selectedCard)}
                alt={selectedCard.name}
                className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-card.png';
                }}
              />
            </div>
          </>
        ) : (
          <>
            <DialogTitle>{cardName} Set Symbols</DialogTitle>
            <DialogDescription>
              Click on a set symbol to view the card from that set
            </DialogDescription>
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-[300px] mt-4">
                <div className="grid grid-cols-3 gap-4">
                  {uniqueSets.map((set) => (
                    <div 
                      key={set.code} 
                      className="text-center cursor-pointer hover:bg-muted p-2 rounded-lg transition-colors"
                      onClick={() => handleSetClick(set)}
                    >
                      <img
                        src={set.symbol}
                        alt={set.name}
                        className="w-8 h-8 mx-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <p className="text-sm mt-1 text-muted-foreground">{set.name}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
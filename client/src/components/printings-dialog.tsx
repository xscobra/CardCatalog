import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getCardPrints, getSetSymbolUrl } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface PrintingsDialogProps {
  cardName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPriceUpdate?: (newPrices: { tcgplayer: number | null; cardkingdom: number | null }) => void;
}

export function PrintingsDialog({ 
  cardName, 
  open, 
  onOpenChange,
  onPriceUpdate 
}: PrintingsDialogProps) {
  const { data: prints, isLoading } = useQuery({
    queryKey: ["prints", cardName],
    queryFn: () => getCardPrints(cardName),
    enabled: open
  });

  const handlePrintingSelect = (print: any) => {
    if (onPriceUpdate) {
      onPriceUpdate({
        tcgplayer: print.prices.usd ? parseFloat(print.prices.usd) : null,
        cardkingdom: print.prices.usd_foil ? parseFloat(print.prices.usd_foil) : null
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogTitle>All Printings of {cardName}</DialogTitle>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-[600px] mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
              {prints?.map((print) => (
                <Card key={print.id}>
                  <CardContent className="p-4">
                    {print.image_uris?.normal && (
                      <img
                        src={print.image_uris.normal}
                        alt={`${print.name} (${print.set_name})`}
                        className="w-full rounded-lg shadow-lg hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="mt-2 text-sm">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <img
                          src={getSetSymbolUrl(print.set)}
                          alt={print.set_name}
                          className="w-6 h-6"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <p className="font-medium">{print.set_name}</p>
                      </div>
                      <div className="flex justify-center items-center gap-2 text-muted-foreground">
                        <span>${print.prices.usd || "N/A"}</span>
                        {print.prices.usd_foil && (
                          <>
                            <span>|</span>
                            <span>Foil: ${print.prices.usd_foil}</span>
                          </>
                        )}
                      </div>
                      <Button 
                        className="w-full mt-2"
                        onClick={() => handlePrintingSelect(print)}
                      >
                        Select This Printing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
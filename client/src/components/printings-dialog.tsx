import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getCardPrints } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface PrintingsDialogProps {
  cardName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrintingsDialog({ cardName, open, onOpenChange }: PrintingsDialogProps) {
  const { data: prints, isLoading } = useQuery({
    queryKey: ["prints", cardName],
    queryFn: () => getCardPrints(cardName),
    enabled: open
  });

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
                      />
                    )}
                    <div className="mt-2 text-sm text-center">
                      <p className="font-medium">{print.set_name}</p>
                      <p className="text-muted-foreground">
                        ${print.prices.usd || "N/A"}
                      </p>
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

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { getCardPrints, getSetSymbolUrl } from "@/lib/api";
import { Loader2 } from "lucide-react";

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
      symbol: getSetSymbolUrl(setCode)
    };
  }).filter(set => set.name && set.symbol) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle>{cardName} Set Symbols</DialogTitle>
        <DialogDescription>
          Available printings from different sets
        </DialogDescription>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-[300px] mt-4">
            <div className="grid grid-cols-3 gap-4">
              {uniqueSets.map((set) => (
                <div key={set.code} className="text-center">
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
      </DialogContent>
    </Dialog>
  );
}
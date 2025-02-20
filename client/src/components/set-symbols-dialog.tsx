import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SetSymbolsDialogProps {
  cardName: string;
  sets: Array<{
    code: string;
    name: string;
    symbol: string;
  }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetSymbolsDialog({
  cardName,
  sets,
  open,
  onOpenChange,
}: SetSymbolsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle>{cardName} Set Symbols</DialogTitle>
        <DialogDescription>
          Available printings from different sets
        </DialogDescription>
        <ScrollArea className="h-[300px] mt-4">
          <div className="grid grid-cols-3 gap-4">
            {sets.map((set) => (
              <div key={set.code} className="text-center">
                <img
                  src={set.symbol}
                  alt={set.name}
                  className="w-8 h-8 mx-auto"
                />
                <p className="text-sm mt-1 text-muted-foreground">{set.name}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

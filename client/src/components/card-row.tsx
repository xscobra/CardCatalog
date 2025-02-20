import { DeckCard } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { useState } from "react";
import { PrintingsDialog } from "./printings-dialog";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface CardRowProps {
  card: DeckCard;
  onRemove: () => void;
  onSetClick: (setName: string) => void;
  onCardClick: () => void;
}

export function CardRow({ card, onRemove, onSetClick, onCardClick }: CardRowProps) {
  const [showPrintings, setShowPrintings] = useState(false);
  const [showImage, setShowImage] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Card className="mb-2">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {card.imageUrl && (
              <img
                src={card.imageUrl}
                alt={card.name}
                className="w-12 h-12 object-cover rounded cursor-pointer"
                onClick={() => setShowImage(true)}
              />
            )}
            <Button variant="ghost" onClick={onCardClick} className="font-medium">
              {card.name}
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {card.sets.map((set) => (
                <TooltipProvider key={set.code}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1"
                        onClick={() => onSetClick(set.name)}
                      >
                        <img src={set.symbol} alt={set.name} className="w-6 h-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{set.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPrintings(true)}
                className="ml-2"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm">
              <span className="mr-4">TCG: ${card.prices.tcgplayer?.toFixed(2) || "N/A"}</span>
              <span>CK: ${card.prices.cardkingdom?.toFixed(2) || "N/A"}</span>
            </div>

            <Button variant="destructive" size="sm" onClick={onRemove}>
              Remove
            </Button>
          </div>
        </CardContent>
      </Card>

      <PrintingsDialog
        cardName={card.name}
        open={showPrintings}
        onOpenChange={setShowPrintings}
      />

      <Dialog open={showImage} onOpenChange={setShowImage}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>{card.name}</DialogTitle>
          <div className="flex justify-center">
            <img
              src={card.imageUrl}
              alt={card.name}
              className="max-w-full rounded-lg shadow-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
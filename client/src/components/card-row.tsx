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
import { SetSymbolsDialog } from "./set-symbols-dialog";
import { Search, Layers } from "lucide-react";
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
  const [showSets, setShowSets] = useState(false);

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSets(true)}
                className="gap-2"
              >
                <Layers className="h-4 w-4" />
                Sets
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPrintings(true)}
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

      <SetSymbolsDialog
        cardName={card.name}
        sets={card.sets}
        open={showSets}
        onOpenChange={setShowSets}
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
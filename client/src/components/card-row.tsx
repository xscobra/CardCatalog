import { DeckCard } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

interface CardRowProps {
  card: DeckCard;
  onRemove: () => void;
  onSetClick: (setName: string) => void;
  onCardClick: () => void;
}

export function CardRow({ card, onRemove, onSetClick, onCardClick }: CardRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Card className="mb-2">
        <CardContent className="p-4 flex items-center justify-between">
          <Button variant="ghost" onClick={onCardClick} className="font-medium">
            {card.name}
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {card.sets.map((set) => (
                <Tooltip key={set.code} content={set.name}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1"
                    onClick={() => onSetClick(set.name)}
                  >
                    <img src={set.symbol} alt={set.name} className="w-6 h-6" />
                  </Button>
                </Tooltip>
              ))}
            </div>
            
            <div className="text-sm">
              <span className="mr-4">TCG: ${card.prices.tcgplayer || "N/A"}</span>
              <span>CK: ${card.prices.cardkingdom || "N/A"}</span>
            </div>

            <Button variant="destructive" size="sm" onClick={onRemove}>
              Remove
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

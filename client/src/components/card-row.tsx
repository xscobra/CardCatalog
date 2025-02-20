import { DeckCard } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useState } from "react";
import { PrintingsDialog } from "./printings-dialog";
import { SetSymbolsDialog } from "./set-symbols-dialog";
import { PriceHistoryDialog } from "./price-history-dialog";
import { PriceAlertDialog } from "./price-alert-dialog";
import { useQuery } from "@tanstack/react-query";
import { Search, Layers, MoreVertical, LineChart, Bell, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CardRowProps {
  card: DeckCard;
  onRemove: () => void;
  onSetClick: (setName: string) => void;
  onCardClick: () => void;
  format?: string;
}

export function CardRow({ card, onRemove, onSetClick, onCardClick, format }: CardRowProps) {
  const [showPrintings, setShowPrintings] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [showSets, setShowSets] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [showPriceAlert, setShowPriceAlert] = useState(false);

  const { data: metadata } = useQuery({
    queryKey: ["/api/cards/metadata", card.id],
    queryFn: () =>
      fetch(`/api/cards/metadata/${card.id}`).then((res) => res.json()),
    enabled: !!format,
  });

  const isLegal = format && metadata?.format_legality?.[format] === 'legal';

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Card className="mb-2">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Card Info Section */}
            <div className="flex items-center gap-4 min-w-0">
              {card.imageUrl && (
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-12 h-12 object-cover rounded cursor-pointer shrink-0"
                  onClick={() => setShowImage(true)}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{card.name}</span>
                  {format && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Award
                          className={`h-4 w-4 shrink-0 ${
                            isLegal ? "text-green-500" : "text-red-500"
                          }`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {isLegal
                          ? `Legal in ${format}`
                          : `Not legal in ${format}`}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  TCG: ${card.prices.tcgplayer?.toFixed(2) || "N/A"}
                  {card.prices.cardkingdom && (
                    <span className="ml-2">
                      • CK: ${card.prices.cardkingdom.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex items-center justify-between sm:justify-end gap-4">
              {/* Mobile view */}
              <div className="flex sm:hidden items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowSets(true)}>
                      View Sets
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowPrintings(true)}>
                      View Printings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowPriceHistory(true)}>
                      Price History
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowPriceAlert(true)}>
                      Set Price Alert
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onRemove} className="text-destructive">
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop view */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSets(true)}
                      >
                        <Layers className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View Sets</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPrintings(true)}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View Printings</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPriceHistory(true)}
                      >
                        <LineChart className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Price History</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPriceAlert(true)}
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Set Price Alert</TooltipContent>
                  </Tooltip>
                </div>

                <Button variant="destructive" size="sm" onClick={onRemove}>
                  Remove
                </Button>
              </div>
            </div>
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
        open={showSets}
        onOpenChange={setShowSets}
      />

      <PriceHistoryDialog
        cardId={card.id}
        cardName={card.name}
        open={showPriceHistory}
        onOpenChange={setShowPriceHistory}
      />

      <PriceAlertDialog
        cardId={card.id}
        cardName={card.name}
        currentPrice={card.prices.tcgplayer}
        open={showPriceAlert}
        onOpenChange={setShowPriceAlert}
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
import { DeckCard } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, PanInfo } from "framer-motion";
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
  onPriceUpdate?: (cardId: string, newPrices: { tcgplayer: number | null; cardkingdom: number | null }) => void;
}

export function CardRow({ 
  card, 
  onRemove, 
  onSetClick, 
  onCardClick, 
  format,
  onPriceUpdate 
}: CardRowProps) {
  const [showPrintings, setShowPrintings] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [showSets, setShowSets] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPrices, setSelectedPrices] = useState(card.prices);

  const { data: metadata } = useQuery({
    queryKey: ["/api/cards/metadata", card.id],
    queryFn: () =>
      fetch(`/api/cards/metadata/${card.id}`).then((res) => res.json()),
    enabled: !!format,
  });

  const isLegal = format && metadata?.format_legality?.[format] === 'legal';

  const handlePrintingSelect = (newPrices: { tcgplayer: number | null; cardkingdom: number | null }) => {
    setSelectedPrices(newPrices);
    if (onPriceUpdate) {
      onPriceUpdate(card.id, newPrices);
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      if (info.offset.x < 0) {
        onRemove();
      }
    }
    setIsDragging(false);
  };

  return (
    <motion.div
      layout
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Card Info Section */}
            <div className="flex items-center gap-4 min-w-0" onClick={() => !isDragging && onCardClick()}>
              {card.imageUrl && (
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-16 h-16 object-cover rounded cursor-pointer shrink-0 touch-manipulation"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowImage(true);
                  }}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium truncate">{card.name}</span>
                  {format && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Award
                          className={`h-5 w-5 shrink-0 ${
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
                <div className="space-y-1 mt-2 text-base text-muted-foreground">
                  <div>TCGplayer: ${selectedPrices.tcgplayer?.toFixed(2) || "N/A"}</div>
                  {selectedPrices.cardkingdom && (
                    <div>Card Kingdom: ${selectedPrices.cardkingdom.toFixed(2)}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex items-center justify-between sm:justify-end gap-4">
              {/* Mobile view */}
              <div className="flex sm:hidden items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="lg" className="p-3">
                      <MoreVertical className="h-6 w-6" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setShowSets(true)} className="py-3">
                      <Layers className="mr-2 h-5 w-5" /> View Sets
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowPrintings(true)} className="py-3">
                      <Search className="mr-2 h-5 w-5" /> View Printings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowPriceHistory(true)} className="py-3">
                      <LineChart className="mr-2 h-5 w-5" /> Price History
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowPriceAlert(true)} className="py-3">
                      <Bell className="mr-2 h-5 w-5" /> Set Price Alert
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onRemove} className="text-destructive py-3">
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
                        size="lg"
                        onClick={() => setShowSets(true)}
                        className="p-3"
                      >
                        <Layers className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View Sets</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => setShowPrintings(true)}
                        className="p-3"
                      >
                        <Search className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View Printings</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => setShowPriceHistory(true)}
                        className="p-3"
                      >
                        <LineChart className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Price History</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => setShowPriceAlert(true)}
                        className="p-3"
                      >
                        <Bell className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Set Price Alert</TooltipContent>
                  </Tooltip>
                </div>

                <Button variant="destructive" size="lg" onClick={onRemove} className="px-6">
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
        onPriceUpdate={handlePrintingSelect}
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
        currentPrice={selectedPrices.tcgplayer}
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
import { useState } from "react";
import { type DeckCard } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCardPrints, getCardImageUrl } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Loader2, DollarSign, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CardRow } from "./card-row";

interface PulledCardsSectionProps {
  pulledCards: DeckCard[];
  onUpdatePulledCard: (cardId: string, selectedSet: DeckCard["selectedSet"]) => void;
  onRemovePulledCard: (cardId: string) => void;
  onMoveToDeck?: (card: DeckCard) => void;
}

export function PulledCardsSection({
  pulledCards,
  onUpdatePulledCard,
  onRemovePulledCard,
  onMoveToDeck,
}: PulledCardsSectionProps) {
  const [selectedCard, setSelectedCard] = useState<DeckCard | null>(null);
  const { toast } = useToast();

  const { data: cardPrints, isLoading } = useQuery({
    queryKey: ["card-prints", selectedCard?.name],
    queryFn: () => selectedCard ? getCardPrints(selectedCard.name) : Promise.resolve([]),
    enabled: !!selectedCard,
  });

  const handleSetSelection = (setCode: string) => {
    if (!selectedCard || !cardPrints) return;

    const selectedPrint = cardPrints.find(print => print.set === setCode);
    if (!selectedPrint) return;

    const selectedSet: DeckCard["selectedSet"] = {
      code: selectedPrint.set,
      name: selectedPrint.set_name,
      symbol: `https://svgs.scryfall.io/sets/${selectedPrint.set}.svg`,
      prices: {
        tcgplayer: selectedPrint.prices.usd ? parseFloat(selectedPrint.prices.usd) : null,
        cardkingdom: selectedPrint.prices.usd_foil ? parseFloat(selectedPrint.prices.usd_foil) : null,
      },
    };

    onUpdatePulledCard(selectedCard.id, selectedSet);
    setSelectedCard(null);
    
    toast({
      title: "Set Updated",
      description: `Updated ${selectedCard.name} to ${selectedSet.name} printing`,
    });
  };

  const calculatePulledTotal = () => {
    return pulledCards.reduce((total, card) => {
      const tcg = card.selectedSet?.prices.tcgplayer || 0;
      const ck = card.selectedSet?.prices.cardkingdom || 0;
      return {
        tcgplayer: total.tcgplayer + tcg,
        cardkingdom: total.cardkingdom + ck,
      };
    }, { tcgplayer: 0, cardkingdom: 0 });
  };

  const totals = calculatePulledTotal();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pulled Cards ({pulledCards.length})</span>
            <div className="text-sm font-normal text-muted-foreground">
              ${totals.tcgplayer.toFixed(2)} TCG / ${totals.cardkingdom.toFixed(2)} CK
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {pulledCards.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No cards pulled yet. Swipe cards away to add them here.
                </p>
              ) : (
                pulledCards.map((card) => (
                  <CardRow
                    key={card.id}
                    card={card}
                    onRemove={() => {
                      if (onMoveToDeck) {
                        onMoveToDeck(card);
                      }
                      onRemovePulledCard(card.id);
                    }}
                    onCardClick={() => setSelectedCard(card)}
                    onSetClick={() => setSelectedCard(card)}
                    onPull={() => {
                      if (onMoveToDeck) {
                        onMoveToDeck(card);
                      }
                      onRemovePulledCard(card.id);
                    }}
                    isPulled={true}
                    onPermanentRemove={() => onRemovePulledCard(card.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Set for {selectedCard?.name}</DialogTitle>
            <DialogDescription>
              Choose which printing to use for price tracking
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <Select onValueChange={handleSetSelection}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a set..." />
                </SelectTrigger>
                <SelectContent>
                  {cardPrints?.map((print) => (
                    <SelectItem key={print.id} value={print.set}>
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://svgs.scryfall.io/sets/${print.set}.svg`}
                          alt={print.set_name}
                          className="w-4 h-4"
                        />
                        <div>
                          <div className="font-medium">{print.set_name}</div>
                          <div className="text-xs text-muted-foreground">
                            TCG: ${print.prices.usd || 'N/A'} | 
                            CK: ${print.prices.usd_foil || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
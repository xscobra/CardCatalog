import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getCardPrints } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { DeckCard, ScryfallCard } from "@shared/schema";

interface SetSelectorProps {
  cardName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSetSelect: (selectedSet: DeckCard["selectedSet"]) => void;
  currentSelectedSet?: DeckCard["selectedSet"];
}

export function SetSelector({
  cardName,
  open,
  onOpenChange,
  onSetSelect,
  currentSelectedSet,
}: SetSelectorProps) {
  const { data: printings, isLoading } = useQuery({
    queryKey: ["card-prints", cardName],
    queryFn: () => getCardPrints(cardName),
    enabled: open && !!cardName,
    staleTime: 60 * 60 * 1000, // Consider data fresh for 1 hour
    cacheTime: 2 * 60 * 60 * 1000, // Keep in cache for 2 hours
  });

  const handleSetSelect = (card: ScryfallCard) => {
    const selectedSet = {
      code: card.set,
      name: card.set_name,
      symbol: `https://svgs.scryfall.io/sets/${card.set}.svg`,
      prices: {
        tcgplayer: card.prices.usd ? parseFloat(card.prices.usd) : null,
        cardkingdom: card.prices.usd_foil ? parseFloat(card.prices.usd_foil) : null,
      },
      imageUrl: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || "",
      cardId: card.id
    };
    onSetSelect(selectedSet);
    onOpenChange(false);
  };

  // Sort printings by release date (newest first)
  const sortedPrintings = printings?.sort((a, b) => 
    new Date(b.released_at || "").getTime() - new Date(a.released_at || "").getTime()
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Set for {cardName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScrollArea className="h-[60vh]">
            <div className="grid gap-3">
              {sortedPrintings.map((card) => (
                <div
                  key={`${card.set}-${card.id}`}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                    currentSelectedSet?.code === card.set ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleSetSelect(card)}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={`https://svgs.scryfall.io/sets/${card.set}.svg`}
                      alt={card.set_name}
                      className="w-8 h-8"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{card.set_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {card.set.toUpperCase()} • {card.released_at || "Unknown date"}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          {card.prices.usd && (
                            <Badge variant="secondary">
                              TCG: ${parseFloat(card.prices.usd).toFixed(2)}
                            </Badge>
                          )}
                          {card.prices.usd_foil && (
                            <Badge variant="outline">
                              CK: ${parseFloat(card.prices.usd_foil).toFixed(2)}
                            </Badge>
                          )}
                          {!card.prices.usd && !card.prices.usd_foil && (
                            <Badge variant="secondary">No price data</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{card.rarity || "Unknown"}</Badge>
                        {card.collector_number && (
                          <Badge variant="outline">#{card.collector_number}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
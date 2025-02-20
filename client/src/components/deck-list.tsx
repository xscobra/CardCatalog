import { type DeckCard } from "@shared/schema";
import { CardRow } from "./card-row";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

interface DeckListProps {
  cards: DeckCard[];
  pickedUpCards: DeckCard[];
  onCardMove: (card: DeckCard, toPickedUp: boolean) => void;
  format?: string;
  totalPrices: {
    tcgplayer: number;
    cardkingdom: number;
  };
  onPriceUpdate?: (cardId: string, newPrices: { tcgplayer: number | null; cardkingdom: number | null }) => void;
}

export function DeckList({ 
  cards, 
  pickedUpCards, 
  onCardMove, 
  format, 
  totalPrices,
  onPriceUpdate 
}: DeckListProps) {
  const [selectedCard, setSelectedCard] = useState<DeckCard | null>(null);

  const handleCardMove = (card: DeckCard, toPickedUp: boolean) => {
    if (toPickedUp && cards.includes(card)) {
      // Moving from deck to picked up
      onCardMove(card, true);
    } else if (!toPickedUp && pickedUpCards.includes(card)) {
      // Removing from picked up section completely
      onCardMove(card, false);
    }
  };

  const PriceFooter = () => (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">TCGplayer Total:</span>
            <span className="text-lg font-bold">${totalPrices.tcgplayer.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Card Kingdom Total:</span>
            <span className="text-lg font-bold">${totalPrices.cardkingdom.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Desktop View */}
      <div className="hidden md:block space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Deck List</h2>
          <ScrollArea className="h-[400px] px-1">
            {cards.map((card) => (
              <CardRow
                key={`deck-${card.id}`}
                card={card}
                onRemove={() => handleCardMove(card, true)}
                onCardClick={() => setSelectedCard(card)}
                format={format}
                onPriceUpdate={onPriceUpdate}
              />
            ))}
          </ScrollArea>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Picked Up</h2>
          <ScrollArea className="h-[200px] px-1">
            {pickedUpCards.map((card) => (
              <CardRow
                key={`picked-${card.id}`}
                card={card}
                onRemove={() => handleCardMove(card, false)}
                onCardClick={() => setSelectedCard(card)}
                format={format}
                onPriceUpdate={onPriceUpdate}
              />
            ))}
          </ScrollArea>
        </div>

        <PriceFooter />
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <Tabs defaultValue="deck" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deck" className="text-lg py-3">
              Deck List ({cards.length})
            </TabsTrigger>
            <TabsTrigger value="picked" className="text-lg py-3">
              Picked Up ({pickedUpCards.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="deck" className="mt-4">
            <ScrollArea className="h-[calc(100vh-16rem)] px-1">
              {cards.map((card) => (
                <CardRow
                  key={`deck-${card.id}`}
                  card={card}
                  onRemove={() => handleCardMove(card, true)}
                  onCardClick={() => setSelectedCard(card)}
                  format={format}
                  onPriceUpdate={onPriceUpdate}
                />
              ))}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="picked" className="mt-4">
            <ScrollArea className="h-[calc(100vh-16rem)] px-1">
              {pickedUpCards.map((card) => (
                <CardRow
                  key={`picked-${card.id}`}
                  card={card}
                  onRemove={() => handleCardMove(card, false)}
                  onCardClick={() => setSelectedCard(card)}
                  format={format}
                  onPriceUpdate={onPriceUpdate}
                />
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <PriceFooter />
      </div>

      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedCard && (
            <div className="text-center">
              <img
                src={selectedCard.imageUrl}
                alt={selectedCard.name}
                className="max-w-full rounded-lg shadow-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
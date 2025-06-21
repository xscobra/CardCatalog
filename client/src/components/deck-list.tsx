import { type DeckCard } from "@shared/schema";
import { CardRow } from "./card-row";
import { PulledCardsSection } from "./pulled-cards-section";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

interface DeckListProps {
  cards: DeckCard[];
  pulledCards: DeckCard[];
  onCardMove: (card: DeckCard, remove: boolean) => void;
  onCardPull: (card: DeckCard) => void;
  onUpdatePulledCard: (cardId: string, selectedSet: DeckCard["selectedSet"]) => void;
  onRemovePulledCard: (cardId: string) => void;
  format?: string;
  totalPrices: {
    tcgplayer: number;
    cardkingdom: number;
  };
  onPriceUpdate?: (cardId: string, newPrices: { tcgplayer: number | null; cardkingdom: number | null }) => void;
}

export function DeckList({ 
  cards,
  pulledCards,
  onCardMove,
  onCardPull,
  onUpdatePulledCard,
  onRemovePulledCard,
  format, 
  totalPrices,
  onPriceUpdate 
}: DeckListProps) {
  const [selectedCard, setSelectedCard] = useState<DeckCard | null>(null);

  const handleCardMove = (card: DeckCard, remove: boolean) => {
    onCardMove(card, remove);
  };

  const handleCardPull = (card: DeckCard) => {
    onCardPull(card);
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
      {/* Always visible deck view */}
      <div className="block space-y-6 lg:space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Deck List</h2>
          <ScrollArea className="h-[300px] sm:h-[350px] lg:h-[400px] px-1">
            {cards.map((card) => (
              <CardRow
                key={`deck-${card.id}`}
                card={card}
                onRemove={() => handleCardMove(card, true)}
                onCardClick={() => setSelectedCard(card)}
                onPull={() => handleCardPull(card)}
                onSetClick={() => {}}
                format={format}
                onPriceUpdate={onPriceUpdate}
              />
            ))}
          </ScrollArea>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Pulled Cards</h2>
          <PulledCardsSection
            pulledCards={pulledCards}
            onUpdatePulledCard={onUpdatePulledCard}
            onRemovePulledCard={onRemovePulledCard}
            onMoveToDeck={(card) => onCardMove(card, false)}
          />
        </div>

        <PriceFooter />
      </div>

      {/* Mobile compact view - show tabs only on very small screens */}
      <div className="sm:hidden">
        <Tabs defaultValue="deck" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deck" className="text-sm sm:text-base lg:text-lg py-2 sm:py-3">
              Deck ({cards.length})
            </TabsTrigger>
            <TabsTrigger value="pulled" className="text-sm sm:text-base lg:text-lg py-2 sm:py-3">
              Pulled ({pulledCards.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="deck" className="mt-4">
            <ScrollArea className="h-[60vh] sm:h-[calc(100vh-16rem)] px-1">
              {cards.map((card) => (
                <CardRow
                  key={`deck-${card.id}`}
                  card={card}
                  onRemove={() => handleCardMove(card, true)}
                  onCardClick={() => setSelectedCard(card)}
                  onPull={() => handleCardPull(card)}
                  onSetClick={() => {}}
                  format={format}
                  onPriceUpdate={onPriceUpdate}
                />
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="pulled" className="mt-4">
            <ScrollArea className="h-[60vh] sm:h-[calc(100vh-16rem)] px-1">
              {pulledCards.map((card) => (
                <CardRow
                  key={`pulled-${card.id}`}
                  card={card}
                  onRemove={() => {
                    // Move back to deck
                    onCardMove(card, false);
                    onRemovePulledCard(card.id);
                  }}
                  onCardClick={() => setSelectedCard(card)}
                  onSetClick={() => {}}
                  format={format}
                  onPriceUpdate={onPriceUpdate}
                  onPull={() => {
                    // Move back to deck
                    onCardMove(card, false);
                    onRemovePulledCard(card.id);
                  }}
                  isPulled={true}
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
import { type DeckCard } from "@shared/schema";
import { CardRow } from "./card-row";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DeckListProps {
  cards: DeckCard[];
  pickedUpCards: DeckCard[];
  onCardMove: (card: DeckCard, toPickedUp: boolean) => void;
}

export function DeckList({ cards, pickedUpCards, onCardMove }: DeckListProps) {
  const [selectedCard, setSelectedCard] = useState<DeckCard | null>(null);
  const [selectedSet, setSelectedSet] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Deck List</h2>
        <ScrollArea className="h-[400px]">
          {cards.map((card) => (
            <CardRow
              key={card.id}
              card={card}
              onRemove={() => onCardMove(card, true)}
              onSetClick={setSelectedSet}
              onCardClick={() => setSelectedCard(card)}
            />
          ))}
        </ScrollArea>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Picked Up</h2>
        <ScrollArea className="h-[200px]">
          {pickedUpCards.map((card) => (
            <CardRow
              key={card.id}
              card={card}
              onRemove={() => onCardMove(card, false)}
              onSetClick={setSelectedSet}
              onCardClick={() => setSelectedCard(card)}
            />
          ))}
        </ScrollArea>
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

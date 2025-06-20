import { useState, useEffect } from "react";
import { CardSearch } from "./card-search";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DeckCard } from "@shared/schema";
import type { ScryfallCard } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CardRow } from "./card-row";
import { SetSelector } from "./set-selector";
import { loadWishlistFromLocal, saveWishlistToLocal } from "@/lib/localStorage";
import { Search } from "lucide-react";

export function CardSearchSection() {
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<DeckCard | null>(null);
  const [selectorOpenCardId, setSelectorOpen] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load wishlist from localStorage on component mount
    const savedWishlist = loadWishlistFromLocal();
    setCards(savedWishlist);
  }, []);

  const transformScryfallCard = (card: ScryfallCard): DeckCard => {
    return {
      id: card.id,
      name: card.name,
      sets: [{
        code: card.set,
        name: card.set_name,
        symbol: `https://svgs.scryfall.io/sets/${card.set}.svg`,
      }],
      prices: {
        tcgplayer: card.prices.usd ? parseFloat(card.prices.usd) : null,
        cardkingdom: card.prices.usd_foil ? parseFloat(card.prices.usd_foil) : null,
      },
      imageUrl: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || "",
      selectedSet: {
        code: card.set,
        name: card.set_name,
        symbol: `https://svgs.scryfall.io/sets/${card.set}.svg`,
        prices: {
          tcgplayer: card.prices.usd ? parseFloat(card.prices.usd) : null,
          cardkingdom: card.prices.usd_foil ? parseFloat(card.prices.usd_foil) : null,
        }
      }
    };
  };

  const handleAddCard = (card: ScryfallCard) => {
    const transformedCard = transformScryfallCard(card);
    if (cards.some(c => c.name === transformedCard.name)) {
      toast({
        title: "Card Already Added",
        description: "This card is already in your search results.",
        variant: "destructive"
      });
      return;
    }
    const updatedCards = [...cards, transformedCard];
    setCards(updatedCards);
    saveWishlistToLocal(updatedCards);
    toast({
      title: "Card Added",
      description: "Card has been added to your search results."
    });
  };

  const handleRemoveCard = (cardId: string) => {
    const updatedCards = cards.filter(c => c.id !== cardId);
    setCards(updatedCards);
    saveWishlistToLocal(updatedCards);
    toast({
      title: "Card Removed",
      description: "Card has been removed from your search results."
    });
  };

  const handleSetSelection = (cardId: string, selectedSet: DeckCard["selectedSet"] & { imageUrl?: string; cardId?: string }) => {
    const updatedCards = cards.map(card => {
      if (card.id === cardId && selectedSet) {
        // Update both the selected set and the main card display to match the selected printing
        return {
          ...card,
          selectedSet: {
            code: selectedSet.code,
            name: selectedSet.name,
            symbol: selectedSet.symbol,
            prices: selectedSet.prices
          },
          prices: selectedSet.prices,
          imageUrl: selectedSet.imageUrl || card.imageUrl,
          // Update the card's main set info to reflect the selected printing
          sets: [{
            code: selectedSet.code,
            name: selectedSet.name,
            symbol: selectedSet.symbol
          }]
        };
      }
      return card;
    });
    setCards(updatedCards);
    saveWishlistToLocal(updatedCards);
  };

  // Calculate total prices using selected set prices
  const totalPrices = cards.reduce(
    (totals, card) => ({
      tcgplayer: totals.tcgplayer + (card.selectedSet?.prices.tcgplayer || 0),
      cardkingdom: totals.cardkingdom + (card.selectedSet?.prices.cardkingdom || 0),
    }),
    { tcgplayer: 0, cardkingdom: 0 }
  );

  return (
    <Card className="mt-6 sm:mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          Card Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2">
          <div>
            <CardSearch onCardSelect={handleAddCard} />
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Searched Cards</h3>
            <ScrollArea className="h-[300px] sm:h-[350px] lg:h-[400px]">
              {cards.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No cards searched yet. Search for cards to see their prices!
                </p>
              ) : (
                cards.map((card) => (
                  <div key={card.id} className="space-y-2">
                    <CardRow
                      card={card}
                      onRemove={() => handleRemoveCard(card.id)}
                      onSetClick={() => setSelectorOpen(card.id)}
                      onCardClick={() => setSelectedCard(card)}
                    />
                    {card.selectedSet && (
                      <div className="ml-4 p-3 bg-muted rounded-md text-sm border-l-4 border-primary">
                        <div className="flex items-center gap-3">
                          <img
                            src={card.selectedSet.symbol}
                            alt={card.selectedSet.name}
                            className="w-5 h-5 flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{card.selectedSet.name}</div>
                            <div className="text-xs text-muted-foreground uppercase">
                              {card.selectedSet.code}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {card.selectedSet.prices.tcgplayer && (
                              <Badge variant="secondary" className="text-xs">
                                TCG: ${card.selectedSet.prices.tcgplayer.toFixed(2)}
                              </Badge>
                            )}
                            {card.selectedSet.prices.cardkingdom && (
                              <Badge variant="outline" className="text-xs">
                                CK: ${card.selectedSet.prices.cardkingdom.toFixed(2)}
                              </Badge>
                            )}
                            {!card.selectedSet.prices.tcgplayer && !card.selectedSet.prices.cardkingdom && (
                              <Badge variant="secondary" className="text-xs">
                                No pricing data
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </ScrollArea>

            {/* Price totals footer */}
            {cards.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">TCGplayer Total:</span>
                      <span className="text-lg font-bold">
                        ${totalPrices.tcgplayer.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Card Kingdom Total:</span>
                      <span className="text-lg font-bold">
                        ${totalPrices.cardkingdom.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedCard && (
              <img
                src={selectedCard.imageUrl}
                alt={selectedCard.name}
                className="w-full h-auto rounded-lg"
              />
            )}
          </DialogContent>
        </Dialog>

        {selectorOpenCardId && (
          <SetSelector
            cardName={cards.find(c => c.id === selectorOpenCardId)?.name || ""}
            open={!!selectorOpenCardId}
            onOpenChange={() => setSelectorOpen(null)}
            onSetSelect={(selectedSet) => {
              if (selectorOpenCardId) {
                handleSetSelection(selectorOpenCardId, selectedSet);
              }
            }}
            currentSelectedSet={cards.find(c => c.id === selectorOpenCardId)?.selectedSet}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Keep the old export for backward compatibility
export { CardSearchSection as WishlistSection };
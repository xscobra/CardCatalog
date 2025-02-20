import { useState, useEffect } from "react";
import { CardSearch } from "./card-search";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DeckCard } from "@shared/schema";
import type { ScryfallCard } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CardRow } from "./card-row";
import { loadWishlistFromLocal, saveWishlistToLocal } from "@/lib/localStorage";

export function WishlistSection() {
  const [cards, setCards] = useState<DeckCard[]>([]);
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
    };
  };

  const handleAddCard = (card: ScryfallCard) => {
    const transformedCard = transformScryfallCard(card);
    if (cards.some(c => c.id === transformedCard.id)) {
      toast({
        title: "Card Already in Wishlist",
        description: "This card is already in your wishlist.",
        variant: "destructive"
      });
      return;
    }
    const updatedCards = [...cards, transformedCard];
    setCards(updatedCards);
    saveWishlistToLocal(updatedCards);
    toast({
      title: "Card Added",
      description: "Card has been added to your wishlist."
    });
  };

  const handleRemoveCard = (cardId: string) => {
    const updatedCards = cards.filter(c => c.id !== cardId);
    setCards(updatedCards);
    saveWishlistToLocal(updatedCards);
    toast({
      title: "Card Removed",
      description: "Card has been removed from your wishlist."
    });
  };

  const handlePriceUpdate = (cardId: string, newPrices: { tcgplayer: number | null; cardkingdom: number | null }) => {
    const updatedCards = cards.map(card =>
      card.id === cardId
        ? { ...card, prices: newPrices }
        : card
    );

    if (JSON.stringify(updatedCards) !== JSON.stringify(cards)) {
      setCards(updatedCards);
      saveWishlistToLocal(updatedCards);
    }
  };

  // Calculate total prices for the wishlist
  const totalPrices = cards.reduce(
    (totals, card) => ({
      tcgplayer: totals.tcgplayer + (card.prices.tcgplayer || 0),
      cardkingdom: totals.cardkingdom + (card.prices.cardkingdom || 0),
    }),
    { tcgplayer: 0, cardkingdom: 0 }
  );

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Wishlist</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <CardSearch onCardSelect={handleAddCard} />
          </div>
          <div className="space-y-4">
            <ScrollArea className="h-[400px]">
              {cards.map((card) => (
                <CardRow
                  key={card.id}
                  card={card}
                  onRemove={() => handleRemoveCard(card.id)}
                  onSetClick={() => {}}
                  onCardClick={() => {}}
                  onPriceUpdate={handlePriceUpdate}
                />
              ))}
            </ScrollArea>

            {/* Price totals footer */}
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
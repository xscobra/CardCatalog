import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CardSearch } from "./card-search";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DeckCard } from "@shared/schema";
import type { ScryfallCard } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CardRow } from "./card-row";

export function WishlistSection() {
  const { data: cards = [] } = useQuery<DeckCard[]>({
    queryKey: ["/api/wishlist"]
  });
  const { toast } = useToast();

  const updateWishlist = useMutation({
    mutationFn: (cards: DeckCard[]) => 
      apiRequest("PUT", "/api/wishlist", cards),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Wishlist Updated",
        description: "Your wishlist has been updated successfully."
      });
    }
  });

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
      imageUrl: card.image_uris?.normal || "",
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
    updateWishlist.mutate([...cards, transformedCard]);
  };

  const handleRemoveCard = (cardId: string) => {
    updateWishlist.mutate(cards.filter(c => c.id !== cardId));
  };

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
          <div>
            <ScrollArea className="h-[400px]">
              {cards.map((card) => (
                <CardRow
                  key={card.id}
                  card={card}
                  onRemove={() => handleRemoveCard(card.id)}
                  onSetClick={() => {}}
                  onCardClick={() => {}}
                />
              ))}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
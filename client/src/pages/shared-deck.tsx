import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DeckList } from "@/components/deck-list";
import { ArrowLeft } from "lucide-react";
import type { SharedDeck } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SharedDeckPage() {
  const { code } = useParams();
  const [, setLocation] = useLocation();

  const { data: deck, isLoading, error } = useQuery<SharedDeck>({
    queryKey: [`/api/shared/${code}`],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/")} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setLocation("/")} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Alert variant="destructive">
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "This shared deck could not be found or is no longer available."}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/")} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{deck.name}</h1>
              {deck.description && (
                <p className="text-muted-foreground">{deck.description}</p>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {deck.views} {deck.views === 1 ? 'view' : 'views'}
          </div>
        </div>

        <DeckList
          cards={deck.cards}
          pickedUpCards={[]}
          onCardMove={() => {}}
          format={deck.format || undefined}
          totalPrices={{
            tcgplayer: deck.cards.reduce((total, card) => total + (card.prices.tcgplayer || 0), 0),
            cardkingdom: deck.cards.reduce((total, card) => total + (card.prices.cardkingdom || 0), 0),
          }}
        />
      </div>
    </div>
  );
}

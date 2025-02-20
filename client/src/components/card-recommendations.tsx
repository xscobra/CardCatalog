import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, CircleDollarSign } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DeckCard } from "@shared/schema";
import type { ScryfallCard } from "@/lib/api";

interface CardRecommendationsProps {
  deckCards: DeckCard[];
  onCardSelect: (card: ScryfallCard) => void;
}

export function CardRecommendations({ deckCards, onCardSelect }: CardRecommendationsProps) {
  const cardIds = deckCards.map(card => card.id);

  const { data: recommendations } = useQuery({
    queryKey: ["/api/recommendations", cardIds],
    queryFn: () =>
      fetch(`/api/recommendations?cardIds=${cardIds.join(",")}`).then((res) =>
        res.json()
      ),
    enabled: cardIds.length > 0,
  });

  const { data: budgetAlternatives } = useQuery({
    queryKey: ["/api/budget-alternatives", cardIds],
    queryFn: () =>
      fetch(`/api/budget-alternatives?cardIds=${cardIds.join(",")}`).then((res) =>
        res.json()
      ),
    enabled: cardIds.length > 0,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Synergistic Cards */}
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              Suggested Cards
            </h3>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {recommendations?.map((rec: any) => (
                  <div
                    key={rec.card.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{rec.card.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Synergy: {(rec.synergy * 100).toFixed(0)}%
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onCardSelect(rec.card)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Add to deck</TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Budget Alternatives */}
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <CircleDollarSign className="w-4 h-4 mr-2" />
              Budget Alternatives
            </h3>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {budgetAlternatives?.map((alt: any) => (
                  <div
                    key={alt.budgetCard.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{alt.budgetCard.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(alt.priceRatio * 100).toFixed(0)}% cheaper than{" "}
                        {alt.originalCard.name}
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onCardSelect(alt.budgetCard)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Add to deck</TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

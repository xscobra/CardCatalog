import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchCards } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CardSearchProps {
  onCardSelect: (card: any) => void;
}

export function CardSearch({ onCardSelect }: CardSearchProps) {
  const [search, setSearch] = useState("");
  const { data: cards, isLoading } = useQuery({
    queryKey: ["cards", search],
    queryFn: () => searchCards(search),
    enabled: search.length > 2
  });

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search for a card..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Search
          </Button>
        </div>
        {cards && cards.length > 0 && (
          <ScrollArea className="h-[300px] mt-4">
            <div className="space-y-2">
              {cards.map((card) => (
                <Button
                  key={card.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => onCardSelect(card)}
                >
                  {card.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

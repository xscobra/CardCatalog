import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchCards, type ScryfallCard } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import debounce from "lodash/debounce";

interface CardSearchProps {
  onCardSelect: (card: ScryfallCard) => void;
}

export function CardSearch({ onCardSelect }: CardSearchProps) {
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: cards, isLoading, error } = useQuery({
    queryKey: ["cards", search],
    queryFn: () => searchCards(search),
    enabled: search.length > 2,
    keepPreviousData: true, // Keep showing previous results while loading new ones
    retry: false, // Don't retry on error as it's likely a user input issue
    onError: (err) => {
      toast({
        title: "Search Error",
        description: err instanceof Error ? err.message : "Failed to search cards",
        variant: "destructive",
      });
    },
  });

  // Debounce the search input to prevent too many API calls
  const debouncedSetSearch = useCallback(
    debounce((value: string) => setSearch(value), 300),
    []
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search will automatically trigger due to the query setup
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search for a card..."
            onChange={(e) => debouncedSetSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Search
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-4 border rounded-md bg-destructive/10 text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Failed to search cards. Please try again.</span>
          </div>
        )}

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

        {cards?.length === 0 && search.length > 2 && (
          <div className="mt-4 text-center text-muted-foreground">
            No cards found matching your search.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Deck } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function Home() {
  const { data: decks } = useQuery<Deck[]>({
    queryKey: ["/api/decks"]
  });
  const { toast } = useToast();
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);

  const deleteDeck = useMutation({
    mutationFn: (deckId: number) => apiRequest("DELETE", `/api/decks/${deckId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({
        title: "Deck Deleted",
        description: "The deck has been deleted successfully."
      });
    }
  });

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">My Deck Lists</h1>
        <Link href="/deck/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Deck
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {decks?.map((deck) => (
          <Card key={deck.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>{deck.name}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  setDeckToDelete(deck);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Link href={`/deck/${deck.id}`}>
                <p className="text-sm text-muted-foreground">
                  {deck.cards.length} cards ({deck.pickedUpCards.length} picked up)
                </p>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog
        open={!!deckToDelete}
        onOpenChange={(open) => !open && setDeckToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your deck
              "{deckToDelete?.name}" and all its cards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deckToDelete) {
                  deleteDeck.mutate(deckToDelete.id);
                  setDeckToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import type { PriceAlert } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";

interface PriceAlertDialogProps {
  cardId: string;
  cardName: string;
  currentPrice: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PriceAlertDialog({
  cardId,
  cardName,
  currentPrice,
  open,
  onOpenChange,
}: PriceAlertDialogProps) {
  const [price, setPrice] = useState("");
  const [isAbove, setIsAbove] = useState(false);
  const { toast } = useToast();

  const { data: alerts, isLoading } = useQuery<PriceAlert[]>({
    queryKey: ["/api/price-alerts", cardId],
    queryFn: () =>
      fetch(`/api/price-alerts?cardId=${cardId}`).then((res) => res.json()),
    enabled: open,
  });

  const createAlert = useMutation({
    mutationFn: (data: Omit<PriceAlert, "id" | "lastNotified">) =>
      apiRequest("POST", "/api/price-alerts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-alerts", cardId] });
      setPrice("");
      toast({
        title: "Price Alert Created",
        description: "You will be notified when the price condition is met.",
      });
    },
  });

  const updateAlert = useMutation({
    mutationFn: ({ id, ...data }: Partial<PriceAlert> & { id: number }) =>
      apiRequest("PATCH", `/api/price-alerts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-alerts", cardId] });
    },
  });

  const handleCreateAlert = () => {
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price.",
        variant: "destructive",
      });
      return;
    }

    createAlert.mutate({
      cardId,
      targetPrice: priceNum,
      isAbove,
      isActive: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle>Price Alerts for {cardName}</DialogTitle>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Price</Label>
              <div className="text-2xl font-bold">
                {currentPrice ? `$${currentPrice.toFixed(2)}` : "N/A"}
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Alert</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label>Above</Label>
                  <Switch
                    checked={isAbove}
                    onCheckedChange={setIsAbove}
                  />
                </div>
              </div>
              <Button
                onClick={handleCreateAlert}
                disabled={!price || createAlert.isPending}
                className="w-full"
              >
                {createAlert.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Alert
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Active Alerts</Label>
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>
                          When price goes{" "}
                          {alert.isAbove ? "above" : "below"}{" "}
                          ${alert.targetPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={alert.isActive}
                      onCheckedChange={(checked) =>
                        updateAlert.mutate({
                          id: alert.id,
                          isActive: checked,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                No alerts set
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

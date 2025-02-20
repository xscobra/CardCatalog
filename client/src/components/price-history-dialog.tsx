import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { PriceHistory } from "@shared/schema";
import { format } from "date-fns";

interface PriceHistoryDialogProps {
  cardId: string;
  cardName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PriceHistoryDialog({
  cardId,
  cardName,
  open,
  onOpenChange,
}: PriceHistoryDialogProps) {
  const [timeRange, setTimeRange] = useState(30); // Default to 30 days

  const { data: priceHistory } = useQuery<PriceHistory[]>({
    queryKey: ["/api/cards", cardId, "price-history", { days: timeRange }],
    queryFn: () =>
      fetch(`/api/cards/${cardId}/price-history?days=${timeRange}`).then((res) =>
        res.json(),
      ),
    enabled: open,
  });

  const timeRanges = [
    { days: 7, label: "7D" },
    { days: 30, label: "1M" },
    { days: 90, label: "3M" },
    { days: 180, label: "6M" },
    { days: 365, label: "1Y" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogTitle>Price History for {cardName}</DialogTitle>
        <div className="space-y-4">
          <div className="flex gap-2">
            {timeRanges.map(({ days, label }) => (
              <Button
                key={days}
                variant={timeRange === days ? "default" : "outline"}
                onClick={() => setTimeRange(days)}
              >
                {label}
              </Button>
            ))}
          </div>
          
          <div className="h-[400px]">
            {priceHistory && priceHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory}>
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(time) => format(new Date(time), "MMM d")}
                  />
                  <YAxis
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Tooltip
                    labelFormatter={(label) =>
                      format(new Date(label), "MMM d, yyyy")
                    }
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No price history available
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

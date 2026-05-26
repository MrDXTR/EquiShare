"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { SettleAllConfirmationDialog } from "./SettleAllConfirmationDialog";

interface SettlementsListProps {
  groupId: string;
  exportButton?: React.ReactNode;
}

export function SettlementsList({
  groupId,
  exportButton,
}: SettlementsListProps) {
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [hoveredSettleId, setHoveredSettleId] = useState<string | null>(null);
  const [showSettled, setShowSettled] = useState(false);
  const utils = api.useUtils();

  // Query all settlements (the API doesn't filter by settled status anymore)
  const { data: allSettlements, isLoading } = api.settlement.list.useQuery({
    groupId,
  });

  // Filter the settlements client-side based on showSettled state
  const settlements = showSettled
    ? allSettlements
    : allSettlements?.filter((s: any) => !s.settled);

  const settleTransaction = api.settlement.settle.useMutation({
    onMutate: (id) => {
      setSettlingId(id);
      toast.loading("Settling transaction...", { id: "settle-transaction" });
    },
    onSuccess: async () => {
      toast.success("Transaction settled", { id: "settle-transaction" });
      await utils.settlement.list.invalidate({ groupId });
      await utils.group.getById.invalidate(groupId);
      await utils.expense.getBalances.invalidate(groupId);
      setSettlingId(null);
    },
    onError: () => {
      toast.error("Failed to settle transaction", { id: "settle-transaction" });
      setSettlingId(null);
    },
  });

  const settleAllTransactions = api.settlement.settleAll.useMutation({
    onMutate: () => {
      toast.loading("Settling all transactions...", { id: "settle-all" });
    },
    onSuccess: async () => {
      toast.success("All transactions settled", { id: "settle-all" });
      await utils.settlement.list.invalidate({ groupId });
      await utils.group.getById.invalidate(groupId);
      await utils.expense.getBalances.invalidate(groupId);
    },
    onError: () => {
      toast.error("Failed to settle all transactions", { id: "settle-all" });
    },
  });

  const handleSettleTransaction = (id: string) => {
    settleTransaction.mutate(id);
  };

  const handleSettleAll = () => {
    settleAllTransactions.mutate(groupId);
  };

  const handleToggleSettled = () => {
    setShowSettled(!showSettled);
  };

  const activeSettlements =
    allSettlements?.filter((s: any) => !s.settled) || [];
  const noRows = (settlements?.length ?? 0) === 0;

  return (
    <div>
      <Card className="border-border bg-background h-full border">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-0">
            <CardTitle className="flex flex-wrap items-center gap-3 text-2xl">
              <div className="border-border rounded-lg border p-2">
                <ArrowRight className="text-foreground h-6 w-6" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 dark:text-gray-100">
                  Settlements
                </span>
                {exportButton && (
                  <div className="flex items-center md:hidden">
                    {exportButton}
                  </div>
                )}
              </div>
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-settled"
                  checked={showSettled}
                  onCheckedChange={handleToggleSettled}
                />
                <Label htmlFor="show-settled" className="text-sm font-medium">
                  {showSettled ? (
                    <div className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      <span>Show Settled</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Hide Settled</span>
                    </div>
                  )}
                </Label>
              </div>

              {exportButton && (
                <div className="hidden md:flex">{exportButton}</div>
              )}

              {activeSettlements.length > 0 && (
                <SettleAllConfirmationDialog
                  onConfirm={handleSettleAll}
                  isPending={settleAllTransactions.isPending}
                  activeSettlementsCount={activeSettlements.length}
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full dark:bg-gray-700" />
                </div>
              ))}
            </div>
          ) : noRows ? (
            <div className="py-12 text-center">
              <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/60 bg-emerald-500/10">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-foreground mb-2 text-2xl font-bold">
                All Settled Up!
              </h3>
              <p className="text-muted-foreground">
                Everyone&apos;s debts are cleared
              </p>
            </div>
          ) : settlements && settlements.length > 0 ? (
            <div className="space-y-3">
              {settlements.map((settlement: any) => {
                const isSettled = settlement.settled;
                const isSettleHovered = hoveredSettleId === settlement.id;

                return (
                  <div
                    key={settlement.id}
                    className={`bg-background relative top-0 overflow-hidden rounded-xl border p-4 shadow-none transition-[top,box-shadow,border-color] duration-200 hover:-top-0.5 ${
                      isSettled || isSettleHovered
                        ? "border-green-500 shadow-lg shadow-green-500/25"
                        : "border-border hover:border-yellow-500 hover:shadow-lg hover:shadow-yellow-500/25"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="border-border text-foreground bg-transparent font-semibold">
                          {settlement.from.name}
                        </Badge>
                        <ArrowRight className="text-muted-foreground h-4 w-4" />
                        <Badge className="border-border text-foreground bg-transparent font-semibold">
                          {settlement.to.name}
                        </Badge>
                        {isSettled && (
                          <Badge
                            variant="outline"
                            className="ml-2 border-green-300 bg-green-50 font-semibold text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Settled
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-foreground text-2xl font-semibold">
                          ₹{settlement.amount.toFixed(2)}
                        </span>
                        {!isSettled && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleSettleTransaction(settlement.id)
                            }
                            onMouseEnter={() =>
                              setHoveredSettleId(settlement.id)
                            }
                            onMouseLeave={() => setHoveredSettleId(null)}
                            onFocus={() => setHoveredSettleId(settlement.id)}
                            onBlur={() => setHoveredSettleId(null)}
                            disabled={settlingId === settlement.id}
                          >
                            {settlingId === settlement.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            <span>Settle</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              <p>No settlements found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

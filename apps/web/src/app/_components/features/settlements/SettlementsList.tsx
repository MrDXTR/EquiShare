"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Eye, EyeOff, TableProperties } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { SettleAllConfirmationDialog } from "./SettleAllConfirmationDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { NetSettlementTable } from "./NetSettlementTable";
import { ScrollFadeArea } from "~/components/ui/scroll-fade-area";
import type { Group } from "../group-management/utils";

interface SettlementsListProps {
  groupId: string;
  exportButton?: React.ReactNode;
  group?: Group;
}

export function SettlementsList({
  groupId,
  exportButton,
  group,
}: SettlementsListProps) {
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [hoveredSettleId, setHoveredSettleId] = useState<string | null>(null);
  const [isSettleAllHovered, setIsSettleAllHovered] = useState(false);
  const [showSettled, setShowSettled] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const utils = api.useUtils();

  const { data: allSettlements, isLoading } = api.settlement.list.useQuery({
    groupId,
  });

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
    onError: (err) => {
      toast.error(`Failed to settle transaction: ${err.message}`, { id: "settle-transaction" });
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
    onError: (err) => {
      toast.error(`Failed to settle all: ${err.message}`, { id: "settle-all" });
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
    <>
      <Card className="border-border/70 bg-card h-full rounded-2xl shadow-xs transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex flex-wrap items-center gap-3 text-xl font-bold tracking-tight">
              <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                <ArrowRight className="size-4" />
              </div>
              <span>Settlements</span>
              {group?.name && (
                <span className="settlement-export-group-name hidden text-sm font-normal text-muted-foreground">
                  • {group.name}
                </span>
              )}
            </CardTitle>

            <div data-export-hide="true" className="flex flex-wrap items-center gap-2.5">
              <div className="flex h-9 items-center gap-2 rounded-lg border border-border/70 bg-background/60 px-3 shadow-2xs">
                <Switch
                  id="show-settled"
                  checked={showSettled}
                  onCheckedChange={handleToggleSettled}
                  className="scale-90"
                />
                <Label htmlFor="show-settled" className="text-xs font-medium cursor-pointer select-none">
                  {showSettled ? (
                    <span className="flex items-center gap-1.5 text-foreground">
                      <Eye className="size-3.5" />
                      <span>Showing Settled</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <EyeOff className="size-3.5" />
                      <span>Hide Settled</span>
                    </span>
                  )}
                </Label>
              </div>

              {exportButton}

              {group && group.expenses.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetailsDialog(true)}
                  className="h-9 min-w-[118px] px-3.5 rounded-lg text-xs font-medium border-border/80 bg-background/80 hover:bg-accent active:scale-[0.96] transition-transform duration-150 gap-1.5 justify-center"
                >
                  <TableProperties className="size-3.5 text-muted-foreground" />
                  <span>Breakdown</span>
                </Button>
              )}

              {activeSettlements.length > 0 && (
                <SettleAllConfirmationDialog
                  onConfirm={handleSettleAll}
                  isPending={settleAllTransactions.isPending}
                  activeSettlementsCount={activeSettlements.length}
                  onHoverChange={setIsSettleAllHovered}
                />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollFadeArea
            fadeHeight={32}
            scrollClassName="max-h-[440px] px-6 pt-1.5 pb-3"
          >
            {isLoading ? (
              <div className="space-y-2.5 pt-1">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : noRows ? (
              <div className="py-12 text-center rounded-xl border border-dashed border-border/70">
                <div className="mb-3 inline-flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="text-foreground text-lg font-bold tracking-tight">
                  All Settled Up!
                </h3>
                <p className="text-muted-foreground text-xs mt-1">
                  All participant debts are currently settled.
                </p>
              </div>
            ) : settlements && settlements.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                {settlements.map((settlement: any) => {
                  const isSettled = settlement.settled;
                  const isSettleHovered = hoveredSettleId === settlement.id;
                  const highlightRow =
                    isSettled || isSettleHovered || isSettleAllHovered;

                  const amount = typeof settlement.amount === "number" ? settlement.amount : 0;
                  const formattedAmount = amount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });

                  return (
                    <div
                      key={settlement.id}
                      className={`relative overflow-hidden rounded-xl border p-3.5 transition-[transform,box-shadow,border-color,background-color] duration-150 ease-out hover:-translate-y-0.5 shadow-2xs ${
                        highlightRow
                          ? "border-emerald-500/40 bg-emerald-500/[0.04] shadow-sm shadow-emerald-500/10"
                          : "border-border/60 bg-background/50 hover:bg-card hover:border-border hover:shadow-xs"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Left: Transfer participants */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-border/80 bg-background/80 text-foreground font-semibold text-xs px-2.5 py-1"
                          >
                            {settlement.from.name}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            pays
                            <ArrowRight className="size-3 text-muted-foreground" />
                          </span>
                          <Badge
                            variant="outline"
                            className="border-border/80 bg-background/80 text-foreground font-semibold text-xs px-2.5 py-1"
                          >
                            {settlement.to.name}
                          </Badge>

                          {isSettled && (
                            <Badge
                              variant="outline"
                              className="ml-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]"
                            >
                              <CheckCircle2 className="mr-1 size-3" />
                              Settled
                            </Badge>
                          )}
                        </div>

                        {/* Right: Amount & Settle action */}
                        <div className="flex items-center justify-between sm:justify-end gap-3.5">
                          <span className="text-foreground text-xl font-bold tracking-tight tabular-nums">
                            ₹{formattedAmount}
                          </span>

                          {!isSettled && (
                            <Button
                              data-export-hide="true"
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
                              className={`min-w-[90px] h-9 text-xs font-semibold active:scale-[0.96] transition-transform duration-150 ${
                                isSettleHovered
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-2xs dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : "hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                              }`}
                            >
                              {settlingId === settlement.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="size-3.5 mr-1" />
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
              <div className="text-muted-foreground py-8 text-center text-sm">
                <p>No settlements found</p>
              </div>
            )}
          </ScrollFadeArea>
        </CardContent>
      </Card>

      {/* Net Settlement Details Dialog */}
      {group && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="flex max-h-[88vh] max-w-[95vw] sm:max-w-4xl flex-col gap-0 overflow-hidden rounded-2xl border border-border/80 bg-card p-0 shadow-2xl">
            <DialogHeader className="border-b border-border/70 px-6 py-4">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold tracking-tight">
                <TableProperties className="size-4.5 text-primary" />
                Net Settlement Breakdown
              </DialogTitle>
              <p className="text-muted-foreground text-xs">
                Each participant&apos;s share per expense, total owed, amount paid, and net balance.
              </p>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
              <NetSettlementTable group={group} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

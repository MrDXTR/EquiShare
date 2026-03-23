"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [showSettled, setShowSettled] = useState(false);
  const utils = api.useUtils();

  // Query all settlements (the API doesn't filter by settled status anymore)
  const { data: allSettlements, isLoading } = api.settlement.list.useQuery({
    groupId,
  });

  // Filter the settlements client-side based on showSettled state
  const settlements = showSettled
    ? allSettlements
    : allSettlements?.filter((s) => !s.settled);

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

  const activeSettlements = allSettlements?.filter((s) => !s.settled) || [];
  const noRows = (settlements?.length ?? 0) === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="h-full border border-border bg-background">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-0">
            <CardTitle className="flex flex-wrap items-center gap-3 text-2xl">
              <div className="rounded-lg border border-border p-2">
                <ArrowRight className="h-6 w-6 text-foreground" />
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
          <AnimatePresence mode="wait">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-12 w-full dark:bg-gray-700" />
                  </div>
                ))}
              </div>
            ) : noRows ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="py-12 text-center"
              >
                <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/60 bg-emerald-500/10">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-foreground">
                  All Settled Up!
                </h3>
                <p className="text-muted-foreground">
                  Everyone&apos;s debts are cleared
                </p>
              </motion.div>
            ) : settlements && settlements.length > 0 ? (
              <div className="space-y-3">
                {settlements.map((settlement, idx) => {
                  const isSettled = settlement.settled;

                  return (
                    <motion.div
                      key={settlement.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`group relative overflow-hidden rounded-xl border bg-background p-4 shadow-sm transition-[box-shadow,border-color] duration-200 hover:border-foreground/20 ${
                        isSettled
                          ? "shadow-emerald-500/10 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_10px_30px_rgba(16,185,129,0.10)]"
                          : "shadow-amber-500/10 hover:shadow-[0_0_0_1px_rgba(34,197,94,0.18),0_10px_30px_rgba(34,197,94,0.12)]"
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="border-border bg-transparent font-semibold text-foreground">
                            {settlement.from.name}
                          </Badge>
                          <ArrowRight
                            className="h-4 w-4 text-muted-foreground"
                          />
                          <Badge className="border-border bg-transparent font-semibold text-foreground">
                            {settlement.to.name}
                          </Badge>
                          {isSettled && (
                            <Badge
                              variant="outline"
                              className="ml-2 border-border bg-transparent font-semibold text-muted-foreground"
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Settled
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="text-2xl font-semibold text-foreground"
                          >
                            ₹{settlement.amount.toFixed(2)}
                          </span>
                          {!isSettled && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleSettleTransaction(settlement.id)
                              }
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
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No settlements found</p>
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

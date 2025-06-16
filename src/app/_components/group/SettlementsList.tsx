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

interface SettlementsListProps {
  groupId: string;
}

export function SettlementsList({ groupId }: SettlementsListProps) {
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [showSettled, setShowSettled] = useState(false);
  const utils = api.useUtils();
  
  // Query all settlements (the API doesn't filter by settled status anymore)
  const { data: allSettlements, isLoading } = api.settlement.list.useQuery({ groupId });
  
  // Filter the settlements client-side based on showSettled state
  const settlements = showSettled ? allSettlements : allSettlements?.filter(s => !s.settled);
  
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
  
  const activeSettlements = allSettlements?.filter(s => !s.settled) || [];
  const noRows = (settlements?.length ?? 0) === 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="h-full border-0 bg-white/80 shadow-xl shadow-indigo-100/50 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-200/60 dark:bg-gray-800/80 dark:shadow-none dark:hover:shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 p-2">
                <ArrowRight className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                Settlements
              </span>
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
              
              {activeSettlements.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSettleAll}
                  disabled={settleAllTransactions.isPending}
                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-800/50"
                >
                  {settleAllTransactions.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  <span>Settle All</span>
                </Button>
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
                <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-green-700 dark:text-green-400">
                  All Settled Up!
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
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
                      className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg
                        ${isSettled 
                          ? "border-green-200/60 bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-green-100/50 dark:border-green-900/30 dark:from-green-900/20 dark:to-emerald-900/20 dark:hover:shadow-green-900/20" 
                          : "border-orange-200/60 bg-gradient-to-r from-orange-50 to-red-50 hover:shadow-orange-100/50 dark:border-orange-900/30 dark:from-orange-900/20 dark:to-red-900/20 dark:hover:shadow-orange-900/20"
                        }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none
                        ${isSettled 
                          ? "from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10" 
                          : "from-orange-500/5 to-red-500/5 dark:from-orange-500/10 dark:to-red-500/10"
                        }`} 
                      />
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge 
                            className="border-orange-300 bg-orange-100 font-semibold text-orange-800 dark:border-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
                          >
                            {settlement.from.name}
                          </Badge>
                          <ArrowRight className={`h-4 w-4 transition-colors group-hover:text-orange-600 dark:group-hover:text-orange-400
                            ${isSettled 
                              ? "text-green-500 group-hover:text-green-600 dark:text-green-400 dark:group-hover:text-green-500" 
                              : "text-gray-500 dark:text-gray-400"
                            }`}
                          />
                          <Badge className="border-green-300 bg-green-100 font-semibold text-green-800 dark:border-green-700 dark:bg-green-900/50 dark:text-green-300">
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
                          <span className={`text-2xl font-bold transition-colors
                            ${isSettled 
                              ? "text-green-600 group-hover:text-green-700 dark:text-green-400 dark:group-hover:text-green-300" 
                              : "text-red-600 group-hover:text-red-700 dark:text-red-400 dark:group-hover:text-red-300"
                            }`}
                          >
                            ₹{settlement.amount.toFixed(2)}
                          </span>
                          {!isSettled && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSettleTransaction(settlement.id)}
                              disabled={settlingId === settlement.id}
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-800/50"
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
              <div className="py-8 text-center text-gray-500">
                <p>No settlements found</p>
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

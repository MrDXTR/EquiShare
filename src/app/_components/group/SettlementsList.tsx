"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { getWhoOwesWhom } from "./utils";

interface SettlementsListProps {
  balances: { person: { id: string; name: string }; balance: number }[];
  isLoading: boolean;
  hasUnsettledExpenses?: boolean;
}

export function SettlementsList({
  balances,
  isLoading,
  hasUnsettledExpenses = true,
}: SettlementsListProps) {
  const whoOwesWhom = getWhoOwesWhom(balances);
  const isAllSettled = whoOwesWhom.length === 0;

  // If there are no unsettled expenses, show the all settled message
  const showAllSettled = isAllSettled || !hasUnsettledExpenses;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="h-full border-0 bg-white/80 shadow-xl shadow-indigo-100/50 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-200/60 dark:bg-gray-800/80 dark:shadow-none dark:hover:shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 p-2">
              <ArrowRight className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
              Settlements
            </span>
          </CardTitle>
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
            ) : showAllSettled ? (
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
            ) : (
              <div className="space-y-3">
                {whoOwesWhom.map((tx, idx) => (
                  <motion.div
                    key={`${tx.from}-${tx.to}-${tx.amount}`}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative overflow-hidden rounded-xl border border-orange-200/60 bg-gradient-to-r from-orange-50 to-red-50 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-100/50 dark:border-orange-900/30 dark:from-orange-900/20 dark:to-red-900/20 dark:hover:shadow-orange-900/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-orange-500/10 dark:to-red-500/10" />
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="border-orange-300 bg-orange-100 font-semibold text-orange-800 dark:border-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                          {tx.from}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-gray-500 transition-colors group-hover:text-orange-600 dark:text-gray-400 dark:group-hover:text-orange-400" />
                        <Badge className="border-green-300 bg-green-100 font-semibold text-green-800 dark:border-green-700 dark:bg-green-900/50 dark:text-green-300">
                          {tx.to}
                        </Badge>
                      </div>
                      <span className="text-2xl font-bold text-red-600 transition-colors group-hover:text-red-700 dark:text-red-400 dark:group-hover:text-red-300">
                        ₹{tx.amount.toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

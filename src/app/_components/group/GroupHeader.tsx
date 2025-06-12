"use client";

import { motion } from "framer-motion";
import { Receipt, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import type { Group } from "./utils";

interface GroupHeaderProps {
  group: Group;
  totalExpenses: number;
  isLoadingBalances: boolean;
  isAllSettled: boolean;
  pendingSettlements: number;
}

export function GroupHeader({
  group,
  totalExpenses,
  isLoadingBalances,
  isAllSettled,
  pendingSettlements,
}: GroupHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 text-center"
    >
      <div className="flex items-center justify-center gap-3">
        <div className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-3">
          <Receipt className="h-8 w-8 text-white" />
        </div>
        <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
          {group.name || "Group Expenses"}
        </h1>
      </div>

      {/* Stats Overview */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-sm">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-gray-700">
            Total: ₹{totalExpenses.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-sm">
          <Receipt className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-gray-700">
            {group.expenses.length} Expenses
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-sm">
          {isLoadingBalances ? (
            <Skeleton className="h-5 w-24" />
          ) : isAllSettled ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-700">
                All Settled!
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span className="font-semibold text-orange-700">
                {pendingSettlements} Pending
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
} 
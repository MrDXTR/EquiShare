"use client";

import { motion, AnimatePresence } from "framer-motion";
import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Receipt, Users, TrendingUp, ArrowRight, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import type { RouterOutputs } from "~/trpc/shared";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { useState } from "react";
import { Skeleton } from "~/components/ui/skeleton";

// Helper to compute minimal transactions
function getWhoOwesWhom(balances: { person: { id: string; name: string }; balance: number }[]) {
  const creditors = balances.filter(b => b.balance > 0).map(b => ({ ...b }));
  const debtors = balances.filter(b => b.balance < 0).map(b => ({ ...b }));
  const transactions: { from: string; to: string; amount: number }[] = [];

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    if (!debtor || !creditor) break;
    const amount = Math.min(-debtor.balance, creditor.balance);
    if (amount > 0) {
      transactions.push({
        from: debtor.person.name,
        to: creditor.person.name,
        amount,
      });
      debtor.balance += amount;
      creditor.balance -= amount;
    }
    if (Math.abs(debtor.balance) < 1e-2) i++;
    if (Math.abs(creditor.balance) < 1e-2) j++;
  }
  return transactions;
}

type Group = RouterOutputs["group"]["getAll"][number];

interface GroupSummaryProps {
  group: Group;
}

export function GroupSummary({ group }: GroupSummaryProps) {
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const utils = api.useUtils();
  const { data: balances, isLoading: isLoadingBalances } = api.expense.getBalances.useQuery(group.id);

  const deleteExpense = api.expense.delete.useMutation({
    onSuccess: async () => {
      await utils.group.getById.invalidate();
      await utils.expense.getBalances.invalidate();
    }
  });

  const handleDeleteExpense = async () => {
    if (expenseToDelete) {
      setIsDeleting(true);
      try {
        await deleteExpense.mutateAsync(expenseToDelete);
        // Wait for the data to be refetched
        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        setIsDeleting(false);
        setExpenseToDelete(null);
      }
    }
  };

  const whoOwesWhom = balances ? getWhoOwesWhom(
    balances
      .filter(b => b.person)
      .map(b => ({ person: { id: b.person!.id, name: b.person!.name }, balance: b.balance }))
  ) : [];

  const totalExpenses = group.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const isAllSettled = whoOwesWhom.length === 0;

  return (
    <div className="min-h-screen  p-4 md:p-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full">
              <Receipt className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {group.name || "Group Expenses"}
            </h1>
          </div>
          
          {/* Stats Overview */}
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-white/20 shadow-sm">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-700">Total: ₹{totalExpenses.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-white/20 shadow-sm">
              <Receipt className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-700">{group.expenses.length} Expenses</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-white/20 shadow-sm">
              {isLoadingBalances ? (
                <Skeleton className="h-5 w-24" />
              ) : isAllSettled ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-700">All Settled!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-orange-700">{whoOwesWhom.length} Pending</span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Expenses Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-blue-100/50 hover:shadow-2xl hover:shadow-blue-200/60 transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                    <Receipt className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Expenses
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {group.expenses.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No expenses yet</p>
                  </div>
                ) : (
                  group.expenses.map((expense: any, index: number) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative overflow-hidden rounded-xl border border-gray-200/60 bg-gradient-to-r from-white to-gray-50/50 p-5 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative flex items-center justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">
                            {expense.description}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Paid by {expense.paidBy.name}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-bold text-2xl text-gray-900 group-hover:text-green-600 transition-colors">
                            ₹{expense.amount.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>Split {expense.shares.length} ways</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                        onClick={() => setExpenseToDelete(expense.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Settlements Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-indigo-100/50 hover:shadow-2xl hover:shadow-indigo-200/60 transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                    <ArrowRight className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Settlements
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatePresence mode="wait">
                  {isLoadingBalances ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : isAllSettled ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-center py-12"
                    >
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-4">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-green-700 mb-2">All Settled Up!</h3>
                      <p className="text-gray-600">Everyone's debts are cleared</p>
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
                          className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200/60 p-4 hover:shadow-lg hover:shadow-orange-100/50 transition-all duration-300 hover:scale-[1.02]"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-orange-100 text-orange-800 border-orange-300 font-semibold">
                                  {tx.from}
                                </Badge>
                                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-orange-600 transition-colors" />
                                <Badge className="bg-green-100 text-green-800 border-green-300 font-semibold">
                                  {tx.to}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-2xl text-red-600 group-hover:text-red-700 transition-colors">
                                ₹{tx.amount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog 
          open={!!expenseToDelete} 
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              setExpenseToDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the expense.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteExpense}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </div>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Receipt, MoreVertical, Loader2, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/shared";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ExpenseForm } from "~/app/_components/features/expense/ExpenseForm/ExpenseForm";

type Group = RouterOutputs["group"]["getById"];

interface ExpensesListProps {
  group: Group;
  onExpenseDeleted: () => void;
}

export function ExpensesList({ group, onExpenseDeleted }: ExpensesListProps) {
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const utils = api.useUtils();

  // Define settlement query input for invalidation
  const settlementQueryInput = { groupId: group.id };

  const deleteExpense = api.expense.delete.useMutation({
    onMutate: () => {
      toast.loading("Deleting expense...", {
        id: "delete-expense",
      });
    },
    onSuccess: async () => {
      if (!group) return;
      await utils.group.getById.invalidate();
      await utils.expense.getBalances.invalidate(group.id);
      await utils.settlement.list.invalidate(settlementQueryInput);
      toast.success("Expense deleted successfully", {
        id: "delete-expense",
        style: {
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          borderColor: "#fecaca",
        },
      });
      setExpenseToDelete(null);
      onExpenseDeleted();
    },
    onError: () => {
      toast.error("Failed to delete expense", {
        id: "delete-expense",
      });
    },
  });

  const handleDelete = () => {
    if (expenseToDelete) {
      deleteExpense.mutate(expenseToDelete);
    }
  };

  const handleExpenseCreated = async () => {
    await utils.group.getById.invalidate();
    await utils.expense.getBalances.invalidate(group.id);
    await utils.settlement.list.invalidate(settlementQueryInput);
    setIsAddingExpense(false);
  };

  if (!group) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="border-border bg-background h-full border">
        <CardHeader className="pb-4">
          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center md:gap-0">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="border-border rounded-lg border p-2">
                <Receipt className="text-foreground h-6 w-6" />
              </div>
              <span className="text-gray-900 dark:text-gray-100">Expenses</span>
            </CardTitle>
            <div>
              <ExpenseForm
                groupId={group.id}
                people={group.people}
                onSuccess={handleExpenseCreated}
                trigger={
                  <Button size="sm" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-24rem)] overflow-y-auto">
          <div className="space-y-4">
            {group.expenses.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                <Receipt className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="text-lg">No expenses yet</p>
              </div>
            ) : (
              group.expenses.map((expense: any, index: number) => {
                const amount =
                  typeof expense.amount === "number" ? expense.amount : 0;
                const settledAmount =
                  typeof expense.settledAmount === "number"
                    ? expense.settledAmount
                    : 0;
                const settledPercent =
                  amount > 0 ? Math.round((settledAmount / amount) * 100) : 0;

                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group border-border bg-background hover:border-foreground/20 relative overflow-hidden rounded-xl border p-5 transition-colors duration-200"
                  >
                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-foreground text-lg font-semibold">
                            {expense.description}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/50 dark:text-blue-400"
                          >
                            Paid by {expense.paidBy.name}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-foreground text-2xl font-semibold">
                          ₹{expense.amount.toFixed(2)}
                        </p>
                        <div className="text-muted-foreground flex items-center gap-1 text-sm">
                          <span>Split {expense.shares.length} ways</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setExpenseToDelete(expense.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Expense Confirmation Dialog */}
      <AlertDialog
        open={!!expenseToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setExpenseToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              expense.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 dark:bg-red-700 dark:text-white dark:hover:bg-red-800 dark:focus:ring-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

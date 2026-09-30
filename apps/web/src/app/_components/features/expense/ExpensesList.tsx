"use client";

import { useState } from "react";
import { Plus, Receipt, Trash2, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ExpenseForm } from "./ExpenseForm/ExpenseForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { Group } from "../group-management/utils";

interface ExpensesListProps {
  group: Group;
  onExpenseDeleted?: () => void;
}

export function ExpensesList({ group, onExpenseDeleted }: ExpensesListProps) {
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const utils = api.useUtils();

  const deleteExpense = api.expense.delete.useMutation({
    onMutate: () => {
      toast.loading("Deleting expense...", { id: "delete-expense" });
    },
    onSuccess: async () => {
      await utils.group.getById.invalidate(group.id);
      await utils.expense.getBalances.invalidate(group.id);
      await utils.settlement.list.invalidate();
      toast.success("Expense deleted", { id: "delete-expense" });
      onExpenseDeleted?.();
      setExpenseToDelete(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`, {
        id: "delete-expense",
      });
    },
  });

  const handleDelete = () => {
    if (expenseToDelete) {
      deleteExpense.mutate(expenseToDelete);
    }
  };

  return (
    <div>
      <Card className="border-border/70 bg-card h-full rounded-2xl shadow-xs transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
              <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                <Receipt className="size-4" />
              </div>
              <div className="flex items-center gap-2">
                <span>Expenses</span>
                <Badge
                  variant="secondary"
                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                >
                  {group.expenses.length}
                </Badge>
              </div>
            </CardTitle>

            <div className="flex items-center gap-2">
              <ExpenseForm
                groupId={group.id}
                people={group.people}
                trigger={
                  <Button
                    size="sm"
                    className="h-9 px-3.5 font-medium active:scale-[0.97] transition-transform duration-150"
                  >
                    <Plus className="size-4 mr-1.5" />
                    <span>Add Expense</span>
                  </Button>
                }
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="max-h-[440px] overflow-y-auto px-6 pt-1.5 pb-3">
          <div className="space-y-3 pt-1">
            {group.expenses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 py-12 text-center">
                <Receipt className="mx-auto mb-3 size-10 text-muted-foreground/40" />
                <p className="text-foreground font-semibold text-base">No expenses recorded</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Add an expense to start calculating balances and settlements.
                </p>
              </div>
            ) : (
              group.expenses.map((expense: any) => {
                const amount = typeof expense.amount === "number" ? expense.amount : 0;
                const formattedAmount = amount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });

                return (
                  <div
                    key={expense.id}
                    className="group border-border/60 bg-background/50 hover:bg-card hover:border-border hover:-translate-y-0.5 hover:shadow-sm rounded-xl border p-4 transition-[transform,box-shadow,border-color,background-color] duration-150 ease-out shadow-2xs relative"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Description & metadata */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <h3 className="text-foreground text-base font-semibold tracking-tight truncate">
                          {expense.description}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="border-primary/20 bg-primary/10 text-primary text-[11px] font-medium"
                          >
                            Paid by {expense.paidBy.name}
                          </Badge>
                          <span className="text-muted-foreground/60 text-xs">•</span>
                          <span className="text-muted-foreground text-xs font-medium">
                            Split {expense.shares.length} {expense.shares.length === 1 ? "way" : "ways"}
                          </span>
                        </div>
                      </div>

                      {/* Right: Amount & actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-foreground text-lg sm:text-xl font-bold tracking-tight tabular-nums">
                            ₹{formattedAmount}
                          </p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-muted-foreground hover:text-foreground active:scale-[0.96] transition-transform duration-150"
                              aria-label="Expense options"
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              onClick={() => setExpenseToDelete(expense.id)}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="mr-2 size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
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
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone and will recalculate all group balances.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="active:scale-[0.97]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90 active:scale-[0.97]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

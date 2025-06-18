"use client";

import { api } from "~/trpc/react";
import { toast } from "sonner";

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
import type { Group } from "./group/utils";
import { GroupHeader } from "./group/GroupHeader";
import { PeopleManagement } from "./group/PeopleManagement";
import { ExpensesList } from "./group/ExpensesList";
import { SettlementsList } from "./group/SettlementsList";
interface GroupSummaryProps {
  group: Group;
  onExpenseCreated?: () => Promise<void>;
  setShowMembersDialog?: (show: boolean) => void;
}

export function GroupSummary({
  group,
  onExpenseCreated,
  setShowMembersDialog,
}: GroupSummaryProps) {
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);
  const [isDeletingPerson, setIsDeletingPerson] = useState(false);
  const utils = api.useUtils();

  // Define settlement query input
  const settlementQueryInput = { groupId: group.id };

  // Query balances for UI display
  const { data: balances, isLoading: isLoadingBalances } =
    api.expense.getBalances.useQuery(group.id);

  // Query settlements to know if we have any
  const { data: settlements, isLoading: isLoadingSettlements } =
    api.settlement.list.useQuery(settlementQueryInput);

  const deleteExpense = api.expense.delete.useMutation({
    onMutate: () => {
      toast.loading("Deleting expense...", {
        id: "delete-expense",
      });
    },
    onSuccess: async () => {
      await utils.group.getById.invalidate();
      await utils.expense.getBalances.invalidate();
      await utils.settlement.list.invalidate();
      toast.success("Expense deleted successfully", {
        id: "delete-expense",
        style: {
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          borderColor: "#fecaca",
        },
      });
    },
    onError: () => {
      toast.error("Failed to delete expense", {
        id: "delete-expense",
      });
    },
  });

  const addPerson = api.group.addPerson.useMutation({
    onMutate: () => {
      toast.loading("Adding person...", {
        id: "add-person",
      });
    },
    onSuccess: async () => {
      setNewPersonName("");
      await utils.group.getById.invalidate(group.id);
      await utils.expense.getBalances.invalidate(group.id);
      await utils.settlement.list.invalidate();
      toast.success("Person added successfully", {
        id: "add-person",
      });
    },
    onError: () => {
      toast.error("Failed to add person", {
        id: "add-person",
      });
    },
  });

  const deletePerson = api.group.deletePerson.useMutation({
    onMutate: () => {
      toast.loading("Deleting person...", {
        id: "delete-person",
      });
    },
    onSuccess: async () => {
      await utils.group.getById.invalidate(group.id);
      await utils.expense.getBalances.invalidate(group.id);
      await utils.settlement.list.invalidate();
      toast.success("Person deleted successfully", {
        id: "delete-person",
        style: {
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          borderColor: "#fecaca",
        },
      });
      setPersonToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete person", {
        id: "delete-person",
      });
    },
  });

  const handleDeleteExpense = async () => {
    if (expenseToDelete) {
      setIsDeleting(true);
      try {
        await deleteExpense.mutateAsync(expenseToDelete);
        // Wait for the data to be refetched
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } finally {
        setIsDeleting(false);
        setExpenseToDelete(null);
      }
    }
  };

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    addPerson.mutate({
      groupId: group.id,
      name: newPersonName.trim(),
    });
  };

  const handleDeletePerson = async () => {
    if (personToDelete) {
      setIsDeletingPerson(true);
      try {
        await deletePerson.mutateAsync({
          groupId: group.id,
          personId: personToDelete,
        });
        // Wait for the data to be refetched
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } finally {
        setIsDeletingPerson(false);
        setPersonToDelete(null);
      }
    }
  };

  const totalExpenses = group.expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  // Check if there are any settlements
  const noRows = !settlements || settlements.length === 0;
  const pendingSettlements = settlements?.filter((s) => !s.settled).length ?? 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        <GroupHeader
          group={group}
          totalExpenses={totalExpenses}
          isLoadingBalances={isLoadingBalances}
          isAllSettled={pendingSettlements === 0}
          pendingSettlements={pendingSettlements}
          isOwner={group.isOwner}
          hasUnsettledExpenses={pendingSettlements > 0}
          onExpenseCreated={onExpenseCreated}
          setShowMembersDialog={setShowMembersDialog}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <PeopleManagement group={group} />
          <ExpensesList
            group={group}
            onExpenseDeleted={() => {
              void utils.group.getById.invalidate(group.id);
              void utils.expense.getBalances.invalidate(group.id);
              void utils.settlement.list.invalidate();
            }}
          />
          <div className="lg:col-span-2">
            <SettlementsList groupId={group.id} />
          </div>
        </div>

        {/* Delete Person Confirmation Dialog */}
        <AlertDialog
          open={!!personToDelete}
          onOpenChange={(open) => {
            if (!open && !isDeletingPerson) {
              setPersonToDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                person and all their associated expenses.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingPerson}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePerson}
                disabled={isDeletingPerson}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeletingPerson ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Deleting...
                  </div>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Expense Confirmation Dialog */}
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
                This action cannot be undone. This will permanently delete the
                expense.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteExpense}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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

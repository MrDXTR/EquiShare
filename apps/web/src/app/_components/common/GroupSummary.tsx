"use client";

import { api } from "~/trpc/react";
import type { Group } from "../features/group-management/utils";
import { GroupHeader } from "../features/group-management/GroupHeader";
import { PeopleManagement } from "../features/group-management/PeopleManagement";
import { ExpensesList } from "../features/expense/ExpensesList";
import { SettlementsExportWrapper } from "../features/settlements/SettlementsExportWrapper";

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
  const utils = api.useUtils();

  const settlementQueryInput = { groupId: group.id };

  // Query balances for UI display
  const { isLoading: isLoadingBalances } =
    api.expense.getBalances.useQuery(group.id);

  // Query settlements to know if we have any
  const { data: settlements } =
    api.settlement.list.useQuery(settlementQueryInput);

  const totalExpenses = group.expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  const pendingSettlements = settlements?.filter((s) => !s.settled).length ?? 0;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="container mx-auto max-w-7xl space-y-6 sm:space-y-8">
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
            <SettlementsExportWrapper groupId={group.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

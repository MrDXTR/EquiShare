"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "~/components/ui/data-table";
import type { Group } from "../group-management/utils";

interface NetSettlementTableProps {
  group: Group;
}

export interface NetSettlementRow {
  personId: string;
  personName: string;
  expenseShares: Record<string, number>; // expenseId -> amount owed
  totalOwes: number;
  paid: number;
  net: number; // positive = should receive, negative = owes
}

export function computeNetSettlementData(group: Group): {
  rows: NetSettlementRow[];
  expenses: { id: string; description: string }[];
} {
  const expenses = group.expenses.map((e) => ({
    id: e.id,
    description: e.description,
  }));

  const personMap = new Map<
    string,
    {
      name: string;
      expenseShares: Record<string, number>;
      totalOwes: number;
      paid: number;
    }
  >();

  for (const person of group.people) {
    personMap.set(person.id, {
      name: person.name,
      expenseShares: {},
      totalOwes: 0,
      paid: 0,
    });
  }

  for (const expense of group.expenses) {
    const payer = personMap.get(expense.paidBy.id);
    if (payer) {
      payer.paid += expense.amount;
    }

    for (const share of expense.shares) {
      const person = personMap.get(share.person.id);
      if (person) {
        person.expenseShares[expense.id] =
          (person.expenseShares[expense.id] ?? 0) + share.amount;
        person.totalOwes += share.amount;
      }
    }
  }

  const rows: NetSettlementRow[] = Array.from(personMap.entries()).map(
    ([personId, data]) => ({
      personId,
      personName: data.name,
      expenseShares: data.expenseShares,
      totalOwes: data.totalOwes,
      paid: data.paid,
      net: data.paid - data.totalOwes,
    }),
  );

  return { rows, expenses };
}

function fmt(amount: number) {
  return `₹${amount.toFixed(0)}`;
}

function MobileNetSettlement({
  rows,
  expenses,
}: {
  rows: NetSettlementRow[];
  expenses: { id: string; description: string }[];
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div
          key={row.personId}
          className="border-border bg-background rounded-lg border p-3"
        >
          {/* Person name + net badge */}
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-foreground text-sm font-semibold">
              {row.personName}
            </span>
            {row.net > 0 ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                Receives {fmt(row.net)}
              </span>
            ) : row.net < 0 ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-400">
                Owes {fmt(Math.abs(row.net))}
              </span>
            ) : (
              <span className="text-muted-foreground rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold dark:bg-gray-800">
                Settled
              </span>
            )}
          </div>

          {/* Per-expense breakdown */}
          {expenses.length > 0 && (
            <div className="border-border mb-2.5 space-y-1 border-t pt-2">
              {expenses.map((expense) => {
                const amount = row.expenseShares[expense.id] ?? 0;
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground max-w-[60%] truncate">
                      {expense.description}
                    </span>
                    <span className="text-foreground">
                      {amount > 0 ? fmt(amount) : "₹0"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Totals row */}
          <div className="border-border flex items-center justify-between border-t pt-2 text-xs">
            <div className="flex gap-3">
              <span className="text-muted-foreground">
                Total Owes:{" "}
                <span className="text-foreground font-medium">
                  {fmt(row.totalOwes)}
                </span>
              </span>
              <span className="text-muted-foreground">
                Paid:{" "}
                <span className="text-foreground font-medium">
                  {fmt(row.paid)}
                </span>
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function buildColumns(
  expenses: { id: string; description: string }[],
): ColumnDef<NetSettlementRow>[] {
  return [
    {
      accessorKey: "personName",
      header: "Person",
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-semibold">
          {row.getValue("personName")}
        </span>
      ),
    },

    ...expenses.map(
      (expense): ColumnDef<NetSettlementRow> => ({
        id: `expense_${expense.id}`,
        header: () => (
          <div
            className="max-w-[100px] truncate text-right text-xs"
            title={expense.description}
          >
            {expense.description}
          </div>
        ),
        cell: ({ row }) => {
          const amount = row.original.expenseShares[expense.id] ?? 0;
          return (
            <div className="text-muted-foreground text-right text-xs tabular-nums">
              {amount > 0 ? fmt(amount) : "₹0"}
            </div>
          );
        },
      }),
    ),

    {
      accessorKey: "totalOwes",
      header: () => (
        <div className="text-right text-xs font-semibold">Total Owes</div>
      ),
      cell: ({ row }) => {
        const total = row.original.totalOwes;
        return (
          <div className="text-right text-xs font-bold tabular-nums">
            {total > 0 ? fmt(total) : "₹0"}
          </div>
        );
      },
    },

    {
      accessorKey: "paid",
      header: () => <div className="text-right text-xs font-semibold">Paid</div>,
      cell: ({ row }) => {
        const paid = row.original.paid;
        return (
          <div className="text-muted-foreground text-right text-xs tabular-nums">
            {paid > 0 ? `₹${paid.toLocaleString("en-IN")}` : "₹0"}
          </div>
        );
      },
    },

    {
      accessorKey: "net",
      header: () => <div className="text-right text-xs font-semibold">Net</div>,
      cell: ({ row }) => {
        const net = row.original.net;
        if (net > 0) {
          return (
            <div className="whitespace-nowrap text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Should receive {fmt(net)}
            </div>
          );
        } else if (net < 0) {
          return (
            <div className="text-foreground whitespace-nowrap text-right text-xs font-semibold">
              Owes {fmt(Math.abs(net))}
            </div>
          );
        }
        return (
          <div className="text-muted-foreground text-right text-xs">
            Settled
          </div>
        );
      },
    },
  ];
}

export function NetSettlementTable({ group }: NetSettlementTableProps) {
  const { rows, expenses } = computeNetSettlementData(group);

  if (expenses.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        No expenses to display.
      </div>
    );
  }

  const columns = buildColumns(expenses);

  return (
    <>
      {/* Mobile: card layout */}
      <div className="sm:hidden">
        <MobileNetSettlement rows={rows} expenses={expenses} />
      </div>

      {/* Desktop: data table */}
      <div className="hidden sm:block">
        <DataTable columns={columns} data={rows} />
      </div>
    </>
  );
}

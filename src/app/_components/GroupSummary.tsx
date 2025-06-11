"use client";

import { motion } from "framer-motion";
import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { RouterOutputs } from "~/trpc/shared";

type Group = RouterOutputs["group"]["getAll"][number];

interface GroupSummaryProps {
  group: Group;
}

export function GroupSummary({ group }: GroupSummaryProps) {
  const { data: balances } = api.expense.getBalances.useQuery(group.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {group.expenses.map((expense: any) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{expense.description}</h3>
                    <p className="text-sm text-muted-foreground">
                      Paid by {expense.paidBy.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${expense.amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Split among {expense.shares.length} people
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {balances?.map((balance) => (
              <motion.div
                key={balance.personId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between"
              >
                <span className="font-medium">{balance.person?.name}</span>
                <span
                  className={
                    balance.balance > 0
                      ? "text-green-600"
                      : balance.balance < 0
                      ? "text-red-600"
                      : ""
                  }
                >
                  {balance.balance > 0
                    ? `+$${balance.balance.toFixed(2)}`
                    : balance.balance < 0
                    ? `-$${Math.abs(balance.balance).toFixed(2)}`
                    : "$0.00"}
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
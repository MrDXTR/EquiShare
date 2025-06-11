"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { GroupSummary } from "~/app/_components/GroupSummary";
import { Plus, Users, Receipt } from "lucide-react";
import { ExpenseForm } from "~/app/_components/ExpenseForm";
import { use } from "react";

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  const { data: group } = api.group.getById.useQuery(resolvedParams.id);
  const { data: balances } = api.expense.getBalances.useQuery(resolvedParams.id);

  if (!group) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {group.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{group.people.length} members</span>
              </div>
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                <span>{group.expenses.length} expenses</span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => setIsAddingExpense(true)}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Expense
          </Button>
        </motion.div>

        {/* Add Expense Form */}
        {isAddingExpense && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
          >
            <ExpenseForm 
              groupId={resolvedParams.id} 
              people={group.people}
              onClose={() => setIsAddingExpense(false)}
            />
          </motion.div>
        )}

        {/* Group Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GroupSummary group={group} />
        </motion.div>
      </div>
    </div>
  );
}
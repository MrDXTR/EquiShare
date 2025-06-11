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
import { Skeleton } from "~/components/ui/skeleton";

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const utils = api.useUtils();

  const { data: group, isLoading: isLoadingGroup } = api.group.getById.useQuery(resolvedParams.id);
  const { data: balances, isLoading: isLoadingBalances } = api.expense.getBalances.useQuery(resolvedParams.id);

  const handleExpenseCreated = async () => {
    await utils.group.getById.invalidate(resolvedParams.id);
    await utils.expense.getBalances.invalidate(resolvedParams.id);
  };

  if (isLoadingGroup) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
        <div className="container mx-auto max-w-7xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-12 w-40" />
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-4">
                <Skeleton className="h-8 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-4">
                <Skeleton className="h-8 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
              onSuccess={handleExpenseCreated}
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
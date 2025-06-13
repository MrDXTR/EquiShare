"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { GroupSummary } from "~/app/_components/GroupSummary";
import {
  Plus,
  Users,
  Receipt,
  UserPlus,
  Share2,
  MoreVertical,
} from "lucide-react";
import { ExpenseForm } from "~/app/_components/ExpenseForm";
import { use } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { GroupHeader } from "~/app/_components/group/GroupHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { GroupMembers } from "~/app/_components/group/GroupMembers";

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const utils = api.useUtils();
  const [showMembersDialog, setShowMembersDialog] = useState(false);

  const { data: group, isLoading: isLoadingGroup } = api.group.getById.useQuery(
    resolvedParams.id,
  );

  const { data: balances, isLoading: isLoadingBalances } =
    api.expense.getBalances.useQuery(resolvedParams.id, {
      enabled: !!group,
    });

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
            className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
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

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <Card className="h-full border-0 bg-white/80 shadow-xl backdrop-blur-sm">
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

            <Card className="h-full border-0 bg-white/80 shadow-xl backdrop-blur-sm">
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

  const totalExpenses = group.expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  const isAllSettled = group.expenses.every((expense) => expense.settled);
  const pendingSettlements = group.expenses.filter(
    (expense) => !expense.settled,
  ).length;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h1 className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-4xl font-bold text-transparent">
                {group.name}
              </h1>

              {!group.isOwner && (
                <Badge
                  variant="outline"
                  className="ml-2 border-blue-200 bg-blue-50 text-blue-700"
                >
                  <Share2 className="mr-1 h-3 w-3" />
                  Shared
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    <span>Members</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Group Members</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Owner */}
                  <DropdownMenuItem className="flex items-center gap-2 py-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={group.createdBy.image || undefined} />
                      <AvatarFallback className="bg-blue-100 text-xs text-blue-600">
                        {(group.createdBy.name || "U").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 items-center justify-between">
                      <span className="text-sm">{group.createdBy.name}</span>
                      <Badge
                        variant="outline"
                        className="ml-2 h-5 border-green-200 bg-green-50 text-xs text-green-700"
                      >
                        Owner
                      </Badge>
                    </div>
                  </DropdownMenuItem>

                  {/* Members */}
                  {group.members &&
                    group.members.length > 0 &&
                    group.members.map((member) => (
                      <DropdownMenuItem
                        key={member.id}
                        className="flex items-center gap-2 py-2"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.image || undefined} />
                          <AvatarFallback className="bg-blue-100 text-xs text-blue-600">
                            {(member.name || "U").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member.name}</span>
                      </DropdownMenuItem>
                    ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowMembersDialog(true)}>
                    <span className="text-blue-600">View all members</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ExpenseForm
                groupId={resolvedParams.id}
                people={group.people}
                onSuccess={handleExpenseCreated}
                trigger={
                  <Button
                    size="sm"
                    className="transform bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                }
              />
            </div>
          </div>

          {/* <GroupHeader 
            group={group} 
            totalExpenses={totalExpenses} 
            isLoadingBalances={isLoadingBalances} 
            isAllSettled={isAllSettled} 
            pendingSettlements={pendingSettlements}
            isOwner={group.isOwner}
          /> */}
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GroupSummary group={group} />
        </motion.div>
      </div>

      {/* Members Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Group Members</DialogTitle>
          </DialogHeader>

          <GroupMembers group={group} isOwner={group.isOwner} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

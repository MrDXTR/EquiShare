"use client";

import { motion } from "framer-motion";
import {
  Receipt,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Plus,
  Users,
  Share2,
} from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { InviteDialog } from "~/app/_components/group/InviteDialog";
import { ExpenseForm } from "~/app/_components/ExpenseForm";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { Group } from "./utils";

interface GroupHeaderProps {
  group: Group;
  totalExpenses: number;
  isLoadingBalances: boolean;
  isAllSettled: boolean;
  pendingSettlements: number;
  isOwner: boolean;
  hasUnsettledExpenses?: boolean;
  onExpenseCreated?: () => Promise<void>;
  setShowMembersDialog?: (show: boolean) => void;
}

export function GroupHeader({
  group,
  totalExpenses,
  isLoadingBalances,
  isAllSettled,
  pendingSettlements,
  isOwner,
  hasUnsettledExpenses = true,
  onExpenseCreated,
  setShowMembersDialog,
}: GroupHeaderProps) {
  // If there are no unsettled expenses, show the all settled message
  const showAllSettled = isAllSettled || !hasUnsettledExpenses;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl dark:from-blue-400 dark:to-indigo-400">
            {group.name || "Group Expenses"}
          </h1>

          {!isOwner && (
            <Badge
              variant="outline"
              className="ml-2 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/50 dark:text-blue-400"
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
                  <AvatarFallback className="bg-blue-100 text-xs text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                    {(group.createdBy.name || "U").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-sm">{group.createdBy.name}</span>
                  <Badge
                    variant="outline"
                    className="ml-2 h-5 border-green-200 bg-green-50 text-xs text-green-700 dark:border-green-800 dark:bg-green-900/50 dark:text-green-400"
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
                      <AvatarFallback className="bg-blue-100 text-xs text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                        {(member.name || "U").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.name}</span>
                  </DropdownMenuItem>
                ))}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  setShowMembersDialog && setShowMembersDialog(true)
                }
              >
                <span className="text-blue-600 dark:text-blue-400">
                  View all members
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ExpenseForm
            groupId={group.id}
            people={group.people}
            onSuccess={onExpenseCreated}
            trigger={
              <Button
                size="sm"
                className="transform bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl dark:from-blue-700 dark:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-800"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            }
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-sm dark:border-gray-700/20 dark:bg-gray-800/70">
          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            Total: ₹{totalExpenses.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-sm dark:border-gray-700/20 dark:bg-gray-800/70">
          <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            {group.expenses.length} Expenses
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-sm dark:border-gray-700/20 dark:bg-gray-800/70">
          {isLoadingBalances ? (
            <Skeleton className="h-5 w-24 dark:bg-gray-700" />
          ) : showAllSettled ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-semibold text-green-700 dark:text-green-400">
                All Settled!
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <span className="font-semibold text-orange-700 dark:text-orange-400">
                {pendingSettlements} Pending
              </span>
            </>
          )}
        </div>

        {isOwner && (
          <InviteDialog groupId={group.id}>
            <div className="flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/90 dark:border-gray-700/20 dark:bg-gray-800/70 dark:hover:bg-gray-800/90">
              <UserPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                Invite Members
              </span>
            </div>
          </InviteDialog>
        )}
      </div>
    </div>
  );
}

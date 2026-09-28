"use client";

import {
  Receipt,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Plus,
  Users,
  Share2,
  Crown,
} from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { InviteDialog } from "~/app/_components/features/group-management/InviteDialog";
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
import { ExpenseForm } from "~/app/_components/features/expense/ExpenseForm/ExpenseForm";
import type { Group } from "./utils";
import { GroupDataExport } from "./GroupDataExport";

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
  const showAllSettled = isAllSettled || !hasUnsettledExpenses;

  // Format currency with Indian grouping and tabular numbers
  const formattedTotal = totalExpenses.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const memberCount = (group.members?.length ?? 0) + 1; // members + owner
  const previewMembers = [
    group.createdBy,
    ...(group.members || []),
  ].slice(0, 4);

  return (
    <div className="border-border/70 bg-card relative overflow-hidden rounded-2xl border p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] backdrop-blur-xs transition-shadow sm:p-7">
      {/* Subtle modern surface glow - contained and theme-adaptive */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-500/5 blur-2xl dark:bg-blue-500/10"
      />

      <div className="relative flex flex-col gap-6">
        {/* Top bar: Identity & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Identity & Badges */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                {group.name || "Group Expenses"}
              </h1>

              {isOwner ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                >
                  <Crown className="size-3 text-amber-500" />
                  Owner
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-border/80 text-muted-foreground gap-1 bg-background/60"
                >
                  <Share2 className="size-3" />
                  Shared
                </Badge>
              )}
            </div>

            <p className="text-muted-foreground flex items-center gap-2 text-xs sm:text-sm">
              <span>Created by {group.createdBy.name}</span>
              <span className="text-muted-foreground/40">•</span>
              <span>{group.people?.length || 0} participants</span>
            </p>
          </div>

          {/* Action cluster */}
          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            {/* Primary Action: Add Expense */}
            <ExpenseForm
              groupId={group.id}
              people={group.people}
              onSuccess={onExpenseCreated}
              trigger={
                <Button
                  size="sm"
                  className="active:scale-[0.97] transition-transform duration-150 h-9 font-medium shadow-xs"
                >
                  <Plus className="size-4" />
                  <span>Add Expense</span>
                </Button>
              }
            />

            {/* Invite members button for owner */}
            {isOwner && (
              <InviteDialog groupId={group.id}>
                <Button
                  variant="outline"
                  size="sm"
                  className="active:scale-[0.97] transition-transform duration-150 h-9 border-border/80 bg-background/80 hover:bg-accent"
                >
                  <UserPlus className="size-4 text-muted-foreground" />
                  <span className="hidden xs:inline">Invite</span>
                </Button>
              </InviteDialog>
            )}

            {/* Members Dropdown / Modal Trigger */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="active:scale-[0.97] transition-transform duration-150 h-9 gap-1.5 border-border/80 bg-background/80 hover:bg-accent px-2.5"
                >
                  {/* Avatar stack preview */}
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {previewMembers.map((m, idx) => (
                      <Avatar
                        key={idx}
                        className="size-5 border-2 border-background ring-1 ring-border/20"
                      >
                        <AvatarImage src={m.image || undefined} />
                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-medium">
                          {(m.name || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-xs font-medium tabular-nums ml-1">
                    {memberCount}
                  </span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-60 p-1.5">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
                  Group Members ({memberCount})
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Owner */}
                <DropdownMenuItem className="flex items-center gap-2.5 py-2 rounded-lg">
                  <Avatar className="size-7">
                    <AvatarImage src={group.createdBy.image || undefined} />
                    <AvatarFallback className="bg-primary/10 text-xs text-primary font-medium">
                      {(group.createdBy.name || "U").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 items-center justify-between min-w-0">
                    <span className="truncate text-sm font-medium">
                      {group.createdBy.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="ml-2 h-4.5 border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-400 font-normal shrink-0"
                    >
                      Owner
                    </Badge>
                  </div>
                </DropdownMenuItem>

                {/* Other members */}
                {group.members &&
                  group.members.slice(0, 5).map((member: any) => (
                    <DropdownMenuItem
                      key={member.id}
                      className="flex items-center gap-2.5 py-2 rounded-lg"
                    >
                      <Avatar className="size-7">
                        <AvatarImage src={member.image || undefined} />
                        <AvatarFallback className="bg-muted text-xs text-muted-foreground font-medium">
                          {(member.name || "U").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm">{member.name}</span>
                    </DropdownMenuItem>
                  ))}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowMembersDialog?.(true)}
                  className="cursor-pointer text-primary focus:text-primary font-medium text-xs justify-center py-2"
                >
                  Manage all members
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export data dropdown */}
            <GroupDataExport group={group} />
          </div>
        </div>

        {/* Stats Grid: Concentric cards with optical alignment and tabular metrics */}
        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
          {/* Total Spent */}
          <div className="group border-border/60 bg-background/50 hover:bg-background/80 hover:border-border rounded-xl border p-4 shadow-2xs transition-colors">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">
                Total Expenses
              </span>
              <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-foreground text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                ₹{formattedTotal}
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Combined group spending
            </p>
          </div>

          {/* Expense Count */}
          <div className="group border-border/60 bg-background/50 hover:bg-background/80 hover:border-border rounded-xl border p-4 shadow-2xs transition-colors">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">
                Transactions
              </span>
              <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Receipt className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-foreground text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                {group.expenses.length}
              </span>
              <span className="text-muted-foreground text-xs">entries</span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Across {group.people.length} participant{group.people.length === 1 ? "" : "s"}
            </p>
          </div>

          {/* Settlement Status */}
          <div className="group border-border/60 bg-background/50 hover:bg-background/80 hover:border-border rounded-xl border p-4 shadow-2xs transition-colors">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">
                Settlement Status
              </span>
              <div
                className={`size-7 rounded-lg flex items-center justify-center ${
                  isLoadingBalances
                    ? "bg-muted text-muted-foreground"
                    : showAllSettled
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                {showAllSettled ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <AlertCircle className="size-4" />
                )}
              </div>
            </div>
            {isLoadingBalances ? (
              <Skeleton className="my-1.5 h-7 w-28" />
            ) : showAllSettled ? (
              <>
                <div className="text-emerald-600 dark:text-emerald-400 text-xl sm:text-2xl font-bold tracking-tight">
                  All Settled
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Zero outstanding debts
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-foreground text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                    {pendingSettlements}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">
                    pending
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Transfers waiting to settle
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

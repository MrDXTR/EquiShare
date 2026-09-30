"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { GroupSummary } from "~/app/_components/common/GroupSummary";
import { use } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { GroupMembers } from "~/app/_components/features/group-management/GroupMembers";

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

  const handleExpenseCreated = async () => {
    await utils.group.getById.invalidate(resolvedParams.id);
    await utils.expense.getBalances.invalidate(resolvedParams.id);
  };

  if (isLoadingGroup) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-2">
              <Skeleton className="h-9 w-64 rounded-xl" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-28 rounded-lg" />
                <Skeleton className="h-4 w-28 rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border border-border/60 bg-card">
              <CardHeader className="pb-3">
                <Skeleton className="h-7 w-36 rounded-lg" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-border/60 bg-card">
              <CardHeader className="pb-3">
                <Skeleton className="h-7 w-36 rounded-lg" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
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
    <div className="min-h-screen bg-background">
      <GroupSummary
        group={group}
        onExpenseCreated={handleExpenseCreated}
        setShowMembersDialog={setShowMembersDialog}
      />

      {/* Members Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Group Members & Access
            </DialogTitle>
          </DialogHeader>

          <GroupMembers group={group} isOwner={group.isOwner} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

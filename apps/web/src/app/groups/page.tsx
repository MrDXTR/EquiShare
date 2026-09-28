"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { toast } from "sonner";
import { GroupCard } from "../_components/features/group-management/groups/GroupCard";
import { CreateGroupDialog } from "../_components/features/group-management/groups/CreateGroupDialog";
import { Layers3 } from "lucide-react";

export default function GroupsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const utils = api.useUtils();
  const { data: groups, isLoading } = api.group.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const acceptInvite = api.invite.acceptInvite.useMutation({
    onSuccess: (data) => {
      toast.success("You've successfully joined the group!");
      router.push(`/groups/${data.groupId}`);
    },
    onError: (error) => {
      toast.error(`Failed to join group: ${error.message}`);
    },
  });

  useEffect(() => {
    const pendingInvite = sessionStorage.getItem("pendingInvite");
    if (pendingInvite && sessionStatus === "authenticated") {
      acceptInvite.mutate(pendingInvite);
      sessionStorage.removeItem("pendingInvite");
    }
  }, [sessionStatus, acceptInvite]);

  const deleteGroup = api.group.delete.useMutation({
    onMutate: () => {
      toast.loading("Deleting group...", {
        id: "delete-group",
      });
    },
    onSuccess: async () => {
      await utils.group.getAll.invalidate();
      toast.success("Group deleted successfully", {
        id: "delete-group",
      });
      setGroupToDelete(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete group: ${error.message}`, {
        id: "delete-group",
      });
    },
  });

  const handleDeleteGroup = async () => {
    if (groupToDelete) {
      setIsDeleting(true);
      try {
        await deleteGroup.mutateAsync(groupToDelete);
        await new Promise((resolve) => setTimeout(resolve, 800));
      } finally {
        setIsDeleting(false);
        setGroupToDelete(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background transition-colors">
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
                Workspace / Groups
              </p>
              <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
                Keep every split in sync.
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Manage your expense groups and shared balances
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <CreateGroupDialog />
            </div>
          </div>
          <div className="mt-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-card/50 h-52 animate-pulse rounded-2xl border border-border/60"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
              Workspace / Groups
            </p>
            <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              Keep every split in sync.
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {groups?.length === 0
                ? "Start by creating your first group"
                : `${groups?.length} ${groups?.length === 1 ? "group" : "groups"} total`}
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <CreateGroupDialog />
          </div>
        </div>

        <div className="border-border/60 mt-8 border-t pt-8">
          {groups?.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 flex flex-col items-center justify-center py-16 px-4 text-center sm:py-20">
              <div className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-xl">
                <Layers3 className="size-6" />
              </div>
              <h3 className="text-foreground mb-1.5 text-lg font-bold tracking-tight">
                No groups yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm text-xs sm:text-sm leading-relaxed">
                Create your first group to start organizing expenses and settling debts with friends or roommates.
              </p>
              <CreateGroupDialog />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {groups?.map((group: any) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onDelete={() => setGroupToDelete(group.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Delete Group Confirmation Dialog */}
        <AlertDialog
          open={!!groupToDelete}
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              setGroupToDelete(null);
            }
          }}
        >
          <AlertDialogContent className="max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Delete Group?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                This action cannot be undone. This will permanently delete the group, its members, and all recorded expenses.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <AlertDialogCancel
                disabled={isDeleting}
                className="h-10 w-full sm:w-auto active:scale-[0.97] transition-transform duration-150 border-border/80"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGroup}
                disabled={isDeleting}
                className="h-10 w-full sm:w-auto bg-destructive text-white hover:bg-destructive/90 active:scale-[0.97] transition-transform duration-150 font-medium"
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Deleting...
                  </div>
                ) : (
                  "Delete Group"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

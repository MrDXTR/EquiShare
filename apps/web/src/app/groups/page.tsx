"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
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
        style: {
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          borderColor: "#fecaca",
        },
      });
      setGroupToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete group", {
        id: "delete-group",
      });
    },
  });

  const handleDeleteGroup = async () => {
    if (groupToDelete) {
      setIsDeleting(true);
      try {
        await deleteGroup.mutateAsync(groupToDelete);
        // Wait for the data to be refetched
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } finally {
        setIsDeleting(false);
        setGroupToDelete(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="dark:bg-background min-h-screen bg-[#fafafa]">
        <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-muted-foreground mb-3 font-mono text-xs tracking-[0.18em] uppercase">
                Workspace / overview
              </p>
              <h1 className="text-foreground text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                Keep every split in sync.
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Manage your expense groups
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <CreateGroupDialog />
            </div>
          </div>
          <div className="mt-6 sm:mt-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-muted/30 h-48 animate-pulse rounded-xl border"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark:bg-background min-h-screen bg-[#fafafa]">
      <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-muted-foreground mb-3 font-mono text-xs tracking-[0.18em] uppercase">
              Workspace / overview
            </p>
            <h1 className="text-foreground text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Keep every split in sync.
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              {groups?.length === 0
                ? "Start by creating your first group"
                : `${groups?.length} ${groups?.length === 1 ? "group" : "groups"} total`}
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <CreateGroupDialog />
          </div>
        </div>

        <div className="border-border/70 mt-8 border-t pt-8 sm:mt-10 sm:pt-10">
          {groups?.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-border bg-background flex flex-col items-center justify-center rounded-lg border border-dashed py-16 sm:py-20"
            >
              <div className="dark:bg-primary dark:text-primary-foreground mb-5 flex size-14 items-center justify-center rounded-lg bg-[#171717] text-white shadow-[8px_8px_0_#d8ccf1]">
                <Layers3 className="size-6" />
              </div>
              <h3 className="text-foreground mb-2 text-xl font-semibold tracking-[-0.03em]">
                No groups yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md text-center text-sm leading-6">
                Create your first group to start splitting expenses with
                friends, family, or colleagues.
              </p>
              <CreateGroupDialog />
            </motion.div>
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
          <AlertDialogContent className="mx-4 max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg">
                Delete Group?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                This action cannot be undone. This will permanently delete the
                group and all its expenses.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
              <AlertDialogCancel
                disabled={isDeleting}
                className="w-full sm:w-auto"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGroup}
                disabled={isDeleting}
                className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-600 sm:w-auto dark:bg-red-700 dark:text-white dark:hover:bg-red-800 dark:focus:ring-red-700"
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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

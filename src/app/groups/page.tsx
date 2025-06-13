"use client";

import { useState } from "react";
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
import { GroupCard } from "~/app/_components/groups/GroupCard";
import { CreateGroupDialog } from "~/app/_components/groups/CreateGroupDialog";

export default function GroupsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const utils = api.useUtils();
  const { data: groups, isLoading } = api.group.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

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
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
                Your Groups
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 sm:text-base">
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
                  className="h-48 animate-pulse rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm dark:from-gray-800 dark:to-gray-700"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
              Your Groups
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 sm:text-base">
              {groups?.length === 0
                ? "Start by creating your first group"
                : `${groups?.length} ${groups?.length === 1 ? "group" : "groups"} total`}
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <CreateGroupDialog />
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
          {groups?.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 sm:py-16"
            >
              <div className="mb-4 rounded-full bg-blue-100 p-6 dark:bg-blue-900">
                <svg
                  className="h-12 w-12 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                No groups yet
              </h3>
              <p className="mb-6 max-w-md text-center text-gray-600 dark:text-gray-300">
                Create your first group to start splitting expenses with
                friends, family, or colleagues.
              </p>
              <CreateGroupDialog />
            </motion.div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {groups?.map((group, index) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onDelete={() => setGroupToDelete(group.id)}
                  index={index}
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
                className="w-full bg-red-600 dark:text-white  hover:bg-red-700 focus:ring-red-600 sm:w-auto dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-700"
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

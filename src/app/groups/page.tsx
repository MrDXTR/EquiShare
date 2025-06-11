"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Users, Receipt, Calendar, Trash2 } from "lucide-react";
import { GroupForm } from "~/app/_components/GroupForm";
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
import { Skeleton } from "~/components/ui/skeleton";

export default function GroupsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isCreating, setIsCreating] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const utils = api.useUtils();
  const { data: groups, isLoading } = api.group.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const deleteGroup = api.group.delete.useMutation({
    onSuccess: async () => {
      await utils.group.getAll.invalidate();
    },
  });

  const handleGroupCreated = async () => {
    await utils.group.getAll.invalidate();
    setIsCreating(false);
  };

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

  return (
    <div className="min-h-screen bg-gray-50/30 p-4 md:p-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"
        >
          <div className="space-y-2">
            <h1 className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-4xl font-bold text-transparent">
              Your Groups
            </h1>
            <p className="text-lg text-gray-600">
              Manage your shared expenses across different groups
            </p>
          </div>

          <Button
            onClick={() => setIsCreating(true)}
            size="lg"
            className="transform bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create New Group
          </Button>
        </motion.div>

        {/* Create Group Form */}
        {isCreating && (
          <GroupForm
            onClose={() => setIsCreating(false)}
            onSuccess={handleGroupCreated}
          />
        )}

        {/* Groups Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(4)].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="group relative"
                >
                  <Card className="h-full border-0 bg-white/80 shadow-xl shadow-blue-100/50 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <Skeleton className="h-6 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-6 w-24" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : groups?.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-20 text-center"
            >
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-indigo-100">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-gray-900">
                No groups yet
              </h3>
              <p className="mx-auto mb-8 max-w-md text-gray-600">
                Create your first group to start tracking shared expenses with
                friends, family, or roommates.
              </p>
              <Button
                onClick={() => setIsCreating(true)}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Group
              </Button>
            </motion.div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {groups?.map((group, index) => {
                const totalExpenses =
                  group.expenses?.reduce(
                    (sum, expense) => sum + expense.amount,
                    0,
                  ) || 0;
                const recentActivity =
                  group.expenses?.length > 0
                    ? new Date(
                        group.expenses[group.expenses.length - 1]?.createdAt ||
                          new Date(),
                      ).toLocaleDateString()
                    : "No activity";

                return (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group relative"
                  >
                    <Card
                      className="h-full cursor-pointer border-0 bg-white/80 shadow-xl shadow-blue-100/50 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-blue-200/60"
                      onClick={() => router.push(`/groups/${group.id}`)}
                    >
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900 transition-colors group-hover:text-blue-700">
                          {group.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">
                              {group.people.length}{" "}
                              {group.people.length === 1 ? "member" : "members"}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="border-blue-200 bg-blue-50 text-blue-700"
                          >
                            Active
                          </Badge>
                        </div>

                        {group.expenses && group.expenses.length > 0 && (
                          <>
                            <Separator />
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Receipt className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium text-gray-700">
                                    {group.expenses.length}{" "}
                                    {group.expenses.length === 1
                                      ? "expense"
                                      : "expenses"}
                                  </span>
                                </div>
                                <span className="text-lg font-bold text-green-600">
                                  ₹{totalExpenses.toFixed(2)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-500">
                                  Last activity: {recentActivity}
                                </span>
                              </div>
                            </div>
                          </>
                        )}

                        {(!group.expenses || group.expenses.length === 0) && (
                          <>
                            <Separator />
                            <div className="py-4 text-center">
                              <Receipt className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                              <p className="text-sm text-gray-500">
                                No expenses yet
                              </p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGroupToDelete(group.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!groupToDelete}
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              setGroupToDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                group and all its expenses.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGroup}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Deleting...
                  </div>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

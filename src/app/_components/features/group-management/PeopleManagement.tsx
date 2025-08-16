"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { Group } from "./utils";
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

interface PeopleManagementProps {
  group: Group;
}

export function PeopleManagement({ group }: PeopleManagementProps) {
  const [newPersonName, setNewPersonName] = useState("");
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);
  const [isDeletingPerson, setIsDeletingPerson] = useState(false);
  const utils = api.useUtils();

  const addPerson = api.group.addPerson.useMutation({
    onMutate: () => {
      toast.loading("Adding person...", {
        id: "add-person",
      });
    },
    onSuccess: async () => {
      setNewPersonName("");
      await utils.group.getById.invalidate(group.id);
      await utils.expense.getBalances.invalidate(group.id);
      toast.success("Person added successfully", {
        id: "add-person",
      });
    },
    onError: () => {
      toast.error("Failed to add person", {
        id: "add-person",
      });
    },
  });

  const deletePerson = api.group.deletePerson.useMutation({
    onMutate: () => {
      toast.loading("Deleting person...", {
        id: "delete-person",
      });
    },
    onSuccess: async () => {
      await utils.group.getById.invalidate(group.id);
      await utils.expense.getBalances.invalidate(group.id);
      toast.success("Person deleted successfully", {
        id: "delete-person",
        style: {
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          borderColor: "#fecaca",
        },
      });
      setPersonToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete person", {
        id: "delete-person",
      });
    },
  });

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    addPerson.mutate({
      groupId: group.id,
      name: newPersonName.trim(),
    });
  };

  const handleDeletePerson = async () => {
    if (personToDelete) {
      setIsDeletingPerson(true);
      try {
        await deletePerson.mutateAsync({
          groupId: group.id,
          personId: personToDelete,
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } finally {
        setIsDeletingPerson(false);
        setPersonToDelete(null);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="h-full border-0 bg-white/80 shadow-xl shadow-blue-100/50 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-blue-200/60 dark:bg-gray-800/80 dark:shadow-none dark:hover:shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="rounded-lg bg-blue-600 p-2">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="text-gray-900 dark:text-gray-100">People</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Person Form */}
          <form onSubmit={handleAddPerson} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPerson" className="dark:text-gray-300">
                Add New Person
              </Label>
              <div className="flex gap-2">
                <Input
                  id="newPerson"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="Enter name"
                  className="flex-1 dark:border-gray-700 dark:bg-gray-800"
                />
                <Button
                  type="submit"
                  disabled={!newPersonName.trim() || addPerson.isPending}
                  className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {addPerson.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* People List */}
          <div className="space-y-3">
            <div
              className={`space-y-3 ${
                group.people.length > 5
                  ? "max-h-[320px] overflow-y-auto pr-1"
                  : ""
              }`}
            >
              {group.people.map((person) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-all duration-200 hover:border-blue-200 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                      {person.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {person.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-100 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 md:opacity-0 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    onClick={() => setPersonToDelete(person.id)}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Person Confirmation Dialog */}
      <AlertDialog
        open={!!personToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeletingPerson) {
            setPersonToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              person and all their associated expenses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingPerson}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePerson}
              disabled={isDeletingPerson}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 dark:bg-red-700 dark:text-white dark:hover:bg-red-800 dark:focus:ring-red-700"
            >
              {isDeletingPerson ? (
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
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { UserPlus, UserMinus, Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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
import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { Group } from "./utils";

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
      toast.loading("Adding person...", { id: "add-person" });
    },
    onSuccess: async () => {
      await utils.group.getById.invalidate(group.id);
      await utils.expense.getBalances.invalidate(group.id);
      setNewPersonName("");
      toast.success("Person added successfully", { id: "add-person" });
    },
    onError: (error) => {
      toast.error(`Failed to add person: ${error.message}`, {
        id: "add-person",
      });
    },
  });

  const deletePerson = api.group.deletePerson.useMutation({
    onMutate: () => {
      toast.loading("Removing person...", { id: "delete-person" });
    },
    onSuccess: async () => {
      await utils.group.getById.invalidate(group.id);
      await utils.expense.getBalances.invalidate(group.id);
      await utils.settlement.list.invalidate();
      toast.success("Person removed successfully", { id: "delete-person" });
      setPersonToDelete(null);
    },
    onError: (error) => {
      toast.error(`Failed to remove person: ${error.message}`, {
        id: "delete-person",
      });
    },
  });

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPersonName.trim()) {
      addPerson.mutate({
        name: newPersonName.trim(),
        groupId: group.id,
      });
    }
  };

  const handleDeletePerson = async () => {
    if (personToDelete) {
      setIsDeletingPerson(true);
      try {
        await deletePerson.mutateAsync({
          groupId: group.id,
          personId: personToDelete,
        });
      } finally {
        setIsDeletingPerson(false);
        setPersonToDelete(null);
      }
    }
  };

  return (
    <div>
      <Card className="border-border/70 bg-card h-full rounded-2xl shadow-xs transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
              <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                <Users className="size-4" />
              </div>
              <div className="flex items-center gap-2">
                <span>Participants</span>
                <Badge
                  variant="secondary"
                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                >
                  {group.people.length}
                </Badge>
              </div>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Add Person Form */}
          <form onSubmit={handleAddPerson} className="space-y-2">
            <Label htmlFor="newPerson" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Add Participant
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="newPerson"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                placeholder="e.g. Alex, Mom, John"
                className="h-10 flex-1 rounded-lg border-border/80 bg-background/80"
              />
              <Button
                type="submit"
                disabled={!newPersonName.trim() || addPerson.isPending}
                className="h-10 px-3.5 shrink-0 rounded-lg active:scale-[0.97] transition-transform duration-150 font-medium"
              >
                {addPerson.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
              </Button>
            </div>
          </form>

          {/* People List */}
          <div className="space-y-2">
            {group.people.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
                No participants yet. Add people to start splitting expenses.
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {group.people.map((person) => (
                  <div
                    key={person.id}
                    className="group border-border/60 bg-background/50 hover:bg-card hover:border-border/90 flex items-center justify-between rounded-xl border p-2.5 transition-colors duration-150 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg text-xs font-semibold">
                        {person.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <span className="text-foreground text-sm font-medium">
                        {person.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-[0.96] transition-[transform,color,background-color] duration-150"
                      onClick={() => setPersonToDelete(person.id)}
                      aria-label={`Remove ${person.name}`}
                    >
                      <UserMinus className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
            <AlertDialogTitle>Remove Person</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will permanently delete this person and their associated expense shares.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeletingPerson}
              className="active:scale-[0.97]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePerson}
              disabled={isDeletingPerson}
              className="bg-destructive text-white hover:bg-destructive/90 active:scale-[0.97]"
            >
              {isDeletingPerson ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
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
  );
}

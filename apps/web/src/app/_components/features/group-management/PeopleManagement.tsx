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
import { ScrollFadeArea } from "~/components/ui/scroll-fade-area";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { Group } from "./utils";

interface PeopleManagementProps {
  group: Group;
}

export function PeopleManagement({ group }: PeopleManagementProps) {
  const [newPersonName, setNewPersonName] = useState("");
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);

  const utils = api.useUtils();

  const addPerson = api.group.addPerson.useMutation({
    onSuccess: async () => {
      await utils.group.getById.invalidate(group.id);
      await utils.expense.getBalances.invalidate(group.id);
      await utils.settlement.list.invalidate();
      setNewPersonName("");
      toast.success("Person added successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deletePerson = api.group.deletePerson.useMutation({
    onSuccess: async () => {
      await utils.group.getById.invalidate(group.id);
      await utils.expense.getBalances.invalidate(group.id);
      await utils.settlement.list.invalidate();
      setPersonToDelete(null);
      toast.success("Person removed successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    // Check for duplicate name (case insensitive)
    const nameExists = group.people.some(
      (person) =>
        person.name.trim().toLowerCase() ===
        newPersonName.trim().toLowerCase(),
    );

    if (nameExists) {
      toast.error("A person with this name already exists");
      return;
    }

    addPerson.mutate({
      groupId: group.id,
      name: newPersonName.trim(),
    });
  };

  const handleDeletePerson = () => {
    if (personToDelete) {
      deletePerson.mutate({
        personId: personToDelete,
        groupId: group.id,
      });
    }
  };

  const isDeletingPerson = deletePerson.isPending;

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
              <ScrollFadeArea
                fadeHeight={28}
                scrollClassName="max-h-[350px] space-y-2 pr-1"
              >
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
              </ScrollFadeArea>
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
        <AlertDialogContent className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Remove Person
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to remove this person from the group? This
              cannot be undone if they are part of any expenses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex gap-2">
            <AlertDialogCancel
              disabled={isDeletingPerson}
              className="active:scale-[0.97] transition-transform duration-150 border-border/80"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePerson}
              disabled={isDeletingPerson}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.97] transition-transform duration-150 font-medium"
            >
              {isDeletingPerson ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  <span>Removing...</span>
                </>
              ) : (
                <span>Remove</span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

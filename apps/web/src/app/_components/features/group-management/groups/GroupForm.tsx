"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GroupFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function GroupForm({ onClose, onSuccess }: GroupFormProps) {
  const [name, setName] = useState("");
  const [people, setPeople] = useState<string[]>([""]);
  const utils = api.useUtils();

  const createGroup = api.group.create.useMutation({
    onMutate: () => {
      toast.loading("Creating group...", {
        id: "create-group",
      });
    },
    onSuccess: async () => {
      setName("");
      setPeople([""]);
      await utils.group.getAll.invalidate();
      toast.success("Group created successfully", {
        id: "create-group",
      });
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      console.error("Failed to create group:", error);
      toast.error("Failed to create group", {
        id: "create-group",
      });
    },
  });

  const addPerson = () => {
    setPeople([...people, ""]);
  };

  const removePerson = (index: number) => {
    setPeople(people.filter((_, i) => i !== index));
  };

  const updatePerson = (index: number, value: string) => {
    const newPeople = [...people];
    newPeople[index] = value;
    setPeople(newPeople);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validPeople = people.filter((p) => p.trim() !== "");
    if (validPeople.length === 0) return;
    createGroup.mutate({
      name,
      people: validPeople,
    });
  };

  const isFormValid =
    name.trim().length > 0 && people.some((p) => p.trim().length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      className="relative"
    >
      <Card className="rounded-2xl border border-border/80 bg-card shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
              <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                <Plus className="size-4" />
              </div>
              <span className="text-foreground">Create New Group</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground active:scale-[0.96]"
            >
              <X className="size-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label
                htmlFor="groupName"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Group Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="groupName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Trip to Goa, Roommate Expenses, Office Lunch"
                className="h-10.5 rounded-lg border-border/80 bg-background/80"
                autoFocus
                required
              />
              <p className="text-xs text-muted-foreground">
                Give your group an identifiable name.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Initial Participants <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {people.map((person, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={person}
                      onChange={(e) => updatePerson(index, e.target.value)}
                      placeholder={`Participant ${index + 1}`}
                      className="h-10 rounded-lg border-border/80 bg-background/80"
                      required
                    />
                    {people.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePerson(index)}
                        className="size-10 shrink-0 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-[0.96]"
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPerson}
                className="mt-1 h-9 w-full rounded-lg border-dashed border-border/80 active:scale-[0.97] transition-transform duration-150"
              >
                <Plus className="mr-1.5 size-4" />
                Add Another Participant
              </Button>
            </div>

            <Separator className="bg-border/60" />

            <div className="flex flex-col-reverse justify-end gap-2.5 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-10 w-full sm:w-auto active:scale-[0.97] transition-transform duration-150 border-border/80"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || createGroup.isPending}
                className="h-10 w-full sm:w-auto font-medium active:scale-[0.97] transition-transform duration-150"
              >
                {createGroup.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Creating...
                  </div>
                ) : (
                  <>
                    <Plus className="mr-1.5 size-4" />
                    Create Group
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

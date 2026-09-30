"use client";

import { useState } from "react";
import { Plus, X, Users, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [people, setPeople] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState("");
  const router = useRouter();

  const createGroup = api.group.create.useMutation({
    onSuccess: (data) => {
      setOpen(false);
      setName("");
      setPeople([]);
      setNewPerson("");
      router.push(`/groups/${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createGroup.mutate({ name: name.trim(), people });
    }
  };

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newPerson.trim();
    if (trimmedName && !people.includes(trimmedName)) {
      setPeople([...people, trimmedName]);
      setNewPerson("");
    }
  };

  const handleRemovePerson = (person: string) => {
    setPeople(people.filter((p) => p !== person));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      newPerson.trim() &&
      !people.includes(newPerson.trim())
    ) {
      e.preventDefault();
      handleAddPerson(e as any);
    }
  };

  const resetForm = () => {
    setName("");
    setPeople([]);
    setNewPerson("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          className="h-10 w-full px-4 font-semibold active:scale-[0.97] transition-transform duration-150 sm:w-auto shadow-xs"
        >
          <Plus className="mr-1.5 size-4" />
          Create New Group
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xl sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Create New Group
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Create a group to start splitting expenses with friends, family, or colleagues.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Group Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Group Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Weekend Trip, Apartment 4B, Goa Vacation"
                className="h-10.5 rounded-lg border-border/80 bg-background/80"
                required
                autoFocus
              />
            </div>

            <Separator className="bg-border/60" />

            {/* Add People Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <Users className="size-3.5 text-primary" />
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Initial Participants
                </Label>
                <span className="text-muted-foreground text-xs font-normal">
                  (Optional)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={newPerson}
                  onChange={(e) => setNewPerson(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter name and press enter"
                  className="h-10 flex-1 rounded-lg border-border/80 bg-background/80"
                />
                <Button
                  type="button"
                  onClick={handleAddPerson}
                  disabled={
                    !newPerson.trim() || people.includes(newPerson.trim())
                  }
                  className="h-10 px-3.5 shrink-0 rounded-lg active:scale-[0.97] transition-transform duration-150"
                  variant="outline"
                  aria-label="Add person"
                >
                  <Plus className="size-4" />
                </Button>
              </div>

              {people.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs text-muted-foreground">
                    {people.length} {people.length === 1 ? "participant" : "participants"} added:
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {people.map((person) => (
                      <Badge
                        key={person}
                        variant="secondary"
                        className="rounded-lg border border-border/70 bg-muted/50 px-2.5 py-1 text-xs text-foreground flex items-center gap-1.5"
                      >
                        <span>{person}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePerson(person)}
                          className="hover:bg-destructive/10 hover:text-destructive active:scale-[0.9] rounded-full p-0.5 transition-colors cursor-pointer"
                          aria-label={`Remove ${person}`}
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-10 w-full sm:w-auto active:scale-[0.97] transition-transform duration-150 border-border/80"
              disabled={createGroup.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createGroup.isPending || !name.trim()}
              className="h-10 w-full sm:w-auto font-medium active:scale-[0.97] transition-transform duration-150"
            >
              {createGroup.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Creating...
                </div>
              ) : (
                "Create Group"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

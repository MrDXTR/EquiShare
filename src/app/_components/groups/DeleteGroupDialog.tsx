"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
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
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DeleteGroupDialogProps {
  groupId: string;
  groupName: string;
}

export function DeleteGroupDialog({ groupId, groupName }: DeleteGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const deleteGroup = api.group.delete.useMutation({
    onMutate: () => {
      toast.loading("Deleting group...", {
        id: "delete-group",
      });
    },
    onSuccess: () => {
      setOpen(false);
      toast.success("Group deleted successfully", {
        id: "delete-group",
        style: { backgroundColor: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" },
      });
      router.push("/groups");
    },
    onError: () => {
      toast.error("Failed to delete group", {
        id: "delete-group",
      });
    },
  });

  const handleDelete = () => {
    deleteGroup.mutate(groupId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="mx-4 max-w-md">
        <DialogHeader className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
            <div className="rounded-full bg-red-100 p-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-lg">Delete Group?</DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed">
            Are you sure you want to delete <span className="font-medium text-gray-900">{`'{groupName}'`}</span>? 
            This will permanently delete the group and all its expenses. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 pt-4 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={deleteGroup.isPending}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteGroup.isPending}
            className="w-full bg-red-600 hover:bg-red-700 sm:w-auto"
          >
            {deleteGroup.isPending ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Deleting...
              </div>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Group
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
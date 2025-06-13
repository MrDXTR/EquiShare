"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MoreVertical, UserMinus, LogOut } from "lucide-react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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
import type { Group } from "./utils";

interface GroupMembersProps {
  group: Group;
  isOwner: boolean;
}

export function GroupMembers({ group, isOwner }: GroupMembersProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const utils = api.useUtils();

  const leaveGroup = api.group.leaveGroup.useMutation({
    onSuccess: () => {
      toast.success("You've left the group");
      router.push("/groups");
    },
    onError: (error) => {
      toast.error(`Failed to leave group: ${error.message}`);
    },
  });

  const removeMember = api.group.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed successfully");
      setMemberToRemove(null);
      // Invalidate the group query to refresh the data
      void utils.group.getById.invalidate(group.id);
    },
    onError: (error) => {
      toast.error(`Failed to remove member: ${error.message}`);
    },
  });

  const handleLeaveGroup = () => {
    leaveGroup.mutate(group.id);
  };

  const handleRemoveMember = (memberId: string) => {
    removeMember.mutate({
      groupId: group.id,
      memberId,
    });
  };

  return (
    <div className="space-y-4 py-4">
      {/* Group Owner */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-500">Owner</h4>
        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border border-white shadow-sm">
              <AvatarImage src={group.createdBy.image || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {(group.createdBy.name || "U").charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{group.createdBy.name}</p>
              <Badge
                variant="outline"
                className="mt-1 border-green-200 bg-green-50 text-green-700"
              >
                Owner
              </Badge>
            </div>
          </div>
          {/* Only show leave option for non-owners who are viewing their own card */}
          {!isOwner && currentUserId === group.createdById && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => setShowLeaveDialog(true)}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Members */}
      {group.members && group.members.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-500">Members</h4>
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border border-white shadow-sm">
                    <AvatarImage src={member.image || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {(member.name || "U").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium">{member.name}</p>
                </div>
                {/* Show dropdown for owner (to remove members) or for the current user (to leave) */}
                {(isOwner || member.id === currentUserId) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isOwner && member.id !== group.createdById && (
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setMemberToRemove(member.id)}
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          Remove Member
                        </DropdownMenuItem>
                      )}
                      {!isOwner && member.id === currentUserId && (
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setShowLeaveDialog(true)}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Leave Group
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* People in expenses */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-500">
          People in Expenses
        </h4>
        <div className="max-h-60 space-y-2 overflow-y-auto">
          {group.people.map((person) => (
            <div
              key={person.id}
              className="flex items-center gap-3 rounded-lg border border-gray-100 p-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                {person.name.charAt(0)}
              </div>
              <p className="text-sm font-medium">{person.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the group? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() =>
                memberToRemove && handleRemoveMember(memberToRemove)
              }
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Group Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this group? You will need to be
              invited again to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleLeaveGroup}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

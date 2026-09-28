"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, UserMinus, LogOut, ShieldCheck, Users } from "lucide-react";
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
    <div className="space-y-5 py-2">
      {/* Group Owner */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Owner
        </h4>
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card/60 p-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <Avatar className="size-9 border border-border/60 ring-1 ring-border/20">
              <AvatarImage src={group.createdBy.image || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {(group.createdBy.name || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {group.createdBy.name}
              </p>
              <Badge
                variant="outline"
                className="mt-1 gap-1 border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-700 dark:text-amber-400"
              >
                <ShieldCheck className="size-3" />
                Group Owner
              </Badge>
            </div>
          </div>
          {!isOwner && currentUserId === group.createdById && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg active:scale-[0.96]"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={() => setShowLeaveDialog(true)}
                >
                  <LogOut className="mr-2 size-4" />
                  Leave Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Members */}
      {group.members && group.members.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Members ({group.members.length})
          </h4>
          <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 p-3 transition-colors hover:bg-accent/40"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-9 border border-border/60">
                    <AvatarImage src={member.image || undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs">
                      {(member.name || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium text-foreground">
                    {member.name}
                  </p>
                </div>
                {(isOwner || member.id === currentUserId) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg active:scale-[0.96]"
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isOwner && member.id !== group.createdById && (
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          onClick={() => setMemberToRemove(member.id)}
                        >
                          <UserMinus className="mr-2 size-4" />
                          Remove Member
                        </DropdownMenuItem>
                      )}
                      {!isOwner && member.id === currentUserId && (
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          onClick={() => setShowLeaveDialog(true)}
                        >
                          <LogOut className="mr-2 size-4" />
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
      <div className="space-y-2.5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Users className="size-3.5" />
          <span>Expense Participants ({group.people.length})</span>
        </h4>
        <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
          {group.people.map((person) => (
            <div
              key={person.id}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/50 p-2.5"
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                {person.name.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm text-foreground">
                {person.name}
              </p>
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
            <AlertDialogCancel className="active:scale-[0.97]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 active:scale-[0.97]"
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
            <AlertDialogCancel className="active:scale-[0.97]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 active:scale-[0.97]"
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

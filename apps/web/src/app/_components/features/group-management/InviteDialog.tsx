"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Clipboard, Check, Loader2, UserPlus, AlertCircle } from "lucide-react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";

interface InviteDialogProps {
  children: React.ReactNode;
  groupId: string;
}

export function InviteDialog({ children, groupId }: InviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [maxUses, setMaxUses] = useState<number>(10);

  const createInvite = api.invite.createInvite.useMutation({
    onSuccess: () => {
      toast.success("Invite link generated successfully");
    },
    onError: (error) => {
      toast.error(`Error creating invite: ${error.message}`);
    },
  });

  const handleGenerateInvite = async () => {
    createInvite.mutate({ groupId, maxUses });
  };

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleCopyToClipboard = () => {
    if (createInvite.data?.inviteLink) {
      void navigator.clipboard.writeText(createInvite.data.inviteLink);
      setCopied(true);
      toast.success("Invite link copied to clipboard");

      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const formatExpiryDate = (expiresAt: Date) => {
    return format(new Date(expiresAt), "MMM d, yyyy");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          createInvite.reset();
          setMaxUses(10);
          setCopied(false);
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-xl">
            <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
              <UserPlus className="size-4" />
            </div>
            <span>Invite Members</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!createInvite.data?.invite && !createInvite.isPending && (
            <div className="flex flex-col space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Generate an invite link to share with others. Anyone with the link can join this group. The link will be valid for 7 days.
              </p>

              <div className="space-y-2">
                <Label htmlFor="max-uses" className="text-sm font-medium">
                  Maximum number of joins
                </Label>
                <Select
                  value={String(maxUses)}
                  onValueChange={(value) => setMaxUses(parseInt(value))}
                >
                  <SelectTrigger id="max-uses" className="h-10 w-full rounded-lg">
                    <SelectValue placeholder="Maximum uses" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem key={num} value={String(num)}>
                        {num} {num === 1 ? "person" : "people"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateInvite}
                className="h-10 w-full font-medium active:scale-[0.97] transition-transform duration-150"
              >
                Generate Invite Link
              </Button>
            </div>
          )}

          {createInvite.isPending && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="text-primary size-7 animate-spin" />
              <p className="text-muted-foreground text-sm">Creating secure invite link...</p>
            </div>
          )}

          {createInvite.isError && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-destructive">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold">Error creating invite</p>
                <p className="text-xs opacity-90">{createInvite.error?.message}</p>
              </div>
            </div>
          )}

          {createInvite.data?.invite && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Invite Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={createInvite.data.inviteLink}
                    className="h-10 font-mono text-xs sm:text-sm bg-muted/40 border-border/70 select-all"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopyToClipboard}
                    className="size-10 shrink-0 border-border/80 active:scale-[0.96] transition-transform duration-150"
                    aria-label="Copy invite link"
                  >
                    <div className="relative size-4 flex items-center justify-center">
                      <Check
                        className={`size-4 text-emerald-600 dark:text-emerald-400 absolute transition-all duration-200 ease-out ${
                          copied
                            ? "scale-100 opacity-100 blur-0"
                            : "scale-50 opacity-0 blur-[2px]"
                        }`}
                      />
                      <Clipboard
                        className={`size-4 text-muted-foreground absolute transition-all duration-200 ease-out ${
                          copied
                            ? "scale-50 opacity-0 blur-[2px]"
                            : "scale-100 opacity-100 blur-0"
                        }`}
                      />
                    </div>
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-muted/30 border border-border/50 p-3 text-xs text-muted-foreground space-y-1">
                <p>
                  • Expires on <span className="font-medium text-foreground">{formatExpiryDate(createInvite.data.invite.expiresAt)}</span>
                </p>
                <p>
                  • Can be used by up to <span className="font-medium text-foreground">{createInvite.data.invite.maxUses} {createInvite.data.invite.maxUses === 1 ? "person" : "people"}</span>
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={handleGenerateInvite}
                  className="h-10 w-full active:scale-[0.97] transition-transform duration-150"
                >
                  Generate New Link
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

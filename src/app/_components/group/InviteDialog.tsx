"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Clipboard, ClipboardCheck, Loader2, UserPlus } from "lucide-react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";

interface InviteDialogProps {
  children: React.ReactNode;
  groupId: string;
}

export function InviteDialog({ children, groupId }: InviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const createInvite = api.invite.createInvite.useMutation({
    onSuccess: () => {
      toast.success("Invite link generated successfully");
    },
    onError: (error) => {
      toast.error(`Error creating invite: ${error.message}`);
    },
  });

  const handleGenerateInvite = async () => {
    createInvite.mutate({ groupId });
  };

  const handleCopyToClipboard = () => {
    if (createInvite.data?.inviteLink) {
      void navigator.clipboard.writeText(createInvite.data.inviteLink);
      setCopied(true);
      toast.success("Invite link copied to clipboard");
      
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatExpiryDate = (expiresAt: Date) => {
    return format(new Date(expiresAt), "MMM d, yyyy");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 p-2">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Invite Members
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {!createInvite.data?.invite && !createInvite.isPending && (
            <div className="flex flex-col items-center space-y-4">
              <p className="text-center text-sm text-gray-500">
                Generate an invite link to share with others. The link will be valid for 7 days.
              </p>
              <Button 
                onClick={handleGenerateInvite} 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Generate Invite Link
              </Button>
            </div>
          )}
          
          {createInvite.isPending && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          )}
          
          {createInvite.isError && (
            <Card className="border-red-200 bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error creating invite</h3>
                  <div className="mt-2 text-sm text-red-700">{createInvite.error?.message}</div>
                </div>
              </div>
            </Card>
          )}
          
          {createInvite.data?.invite && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Invite Link</p>
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <Input 
                    readOnly 
                    value={createInvite.data.inviteLink} 
                    className="h-9 truncate bg-gray-50 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyToClipboard}
                    className="h-9 px-3 border-indigo-200 hover:bg-indigo-50"
                  >
                    {copied ? (
                      <ClipboardCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clipboard className="h-4 w-4 text-indigo-500" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">
                  Expires on {formatExpiryDate(createInvite.data.invite.expiresAt)}
                </p>
              </div>
              
              <div className="pt-2">
                <Button
                  onClick={handleGenerateInvite}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
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
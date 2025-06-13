"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Loader2, UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface InvitePageClientProps {
  token: string;
}

export function InvitePageClient({ token }: InvitePageClientProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [acceptingInvite, setAcceptingInvite] = useState(false);

  const {
    data: invite,
    isLoading,
    error,
  } = api.invite.getInviteByToken.useQuery(token, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const acceptInvite = api.invite.acceptInvite.useMutation({
    onMutate: () => {
      setAcceptingInvite(true);
    },
    onSuccess: (data) => {
      toast.success("You've successfully joined the group!");
      // Redirect to the group page
      setTimeout(() => {
        router.push(`/groups/${data.groupId}`);
      }, 1500);
    },
    onError: (error) => {
      toast.error(`Failed to join group: ${error.message}`);
      setAcceptingInvite(false);
    },
  });

  const rejectInvite = api.invite.rejectInvite.useMutation({
    onSuccess: () => {
      toast.success("Invitation rejected");
      // Redirect to the groups page
      setTimeout(() => {
        router.push("/groups");
      }, 1500);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleAcceptInvite = () => {
    if (sessionStatus === "authenticated") {
      acceptInvite.mutate(token);
    } else {
      // Store the token in session storage and redirect to login
      sessionStorage.setItem("pendingInvite", token);
      router.push(`/api/auth/signin?callbackUrl=/invite/${token}`);
    }
  };

  const handleRejectInvite = () => {
    if (sessionStatus === "authenticated") {
      rejectInvite.mutate(token);
    } else {
      router.push("/groups");
    }
  };

  // Check for pending invite after login
  useEffect(() => {
    const pendingInvite = sessionStorage.getItem("pendingInvite");
    if (
      pendingInvite === token &&
      sessionStatus === "authenticated" &&
      !acceptingInvite &&
      !acceptInvite.isSuccess
    ) {
      acceptInvite.mutate(token);
      sessionStorage.removeItem("pendingInvite");
    }
  }, [
    sessionStatus,
    token,
    acceptingInvite,
    acceptInvite.isSuccess,
    acceptInvite,
  ]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md p-4">
          <Card className="overflow-hidden border-0 shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 dark:text-gray-300" />
              <h2 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
                Loading invitation...
              </h2>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md p-4">
          <Card className="overflow-hidden border-0 shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
                Invitation Error
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {error.message}
              </p>
              <Button
                className="mt-6 dark:text-white"
                onClick={() => router.push("/groups")}
              >
                Go to Groups
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (acceptInvite.isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden border-0 shadow-lg dark:border-gray-800 dark:bg-gray-900">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                  <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
                  Successfully Joined!
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  You have successfully joined the group. Redirecting...
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!invite) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md p-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-blue-100 p-3 dark:bg-gray-800">
                  <UserPlus className="h-8 w-8 text-blue-500 dark:text-gray-300" />
                </div>

                <h1 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-100">
                  Group Invitation
                </h1>

                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  You&apos;ve been invited to join
                </p>

                <h2 className="mt-1 text-xl font-semibold text-blue-600 dark:text-gray-200">
                  {invite.group.name}
                </h2>

                <div className="mt-4 flex items-center">
                  {invite.invitedBy.image ? (
                    <Image
                      src={invite.invitedBy.image}
                      alt={invite.invitedBy.name || "User"}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-500 dark:bg-gray-800 dark:text-gray-300">
                      {(invite.invitedBy.name || "U").charAt(0)}
                    </div>
                  )}
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                    Invited by {invite.invitedBy.name}
                  </span>
                </div>

                <div className="mt-6 flex w-full flex-col space-y-3">
                  <Button
                    onClick={handleAcceptInvite}
                    disabled={acceptingInvite}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-700"
                    size="lg"
                  >
                    {acceptingInvite ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      "Join Group"
                    )}
                  </Button>

                  <Button
                    onClick={handleRejectInvite}
                    variant="outline"
                    className="w-full dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                    disabled={acceptingInvite}
                  >
                    Decline
                  </Button>
                </div>

                {sessionStatus === "unauthenticated" && (
                  <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    You&apos;ll need to sign in to join this group
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

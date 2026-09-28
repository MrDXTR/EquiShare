"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
      setTimeout(() => {
        router.push(`/groups/${data.groupId}`);
      }, 1200);
    },
    onError: (error) => {
      toast.error(`Failed to join group: ${error.message}`);
      setAcceptingInvite(false);
    },
  });

  const rejectInvite = api.invite.rejectInvite.useMutation({
    onSuccess: () => {
      toast.success("Invitation rejected");
      setTimeout(() => {
        router.push("/groups");
      }, 1200);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleAcceptInvite = () => {
    if (sessionStatus === "authenticated") {
      acceptInvite.mutate(token);
    } else {
      sessionStorage.setItem("pendingInvite", token);
      router.push(`/api/auth/signin`);
    }
  };

  const handleRejectInvite = () => {
    if (sessionStatus === "authenticated") {
      rejectInvite.mutate(token);
    } else {
      router.push("/groups");
    }
  };

  useEffect(() => {
    if (
      sessionStatus === "authenticated" &&
      !acceptingInvite &&
      !acceptInvite.isSuccess
    ) {
      const currentPathname = window.location.pathname;
      const isInvitePage = currentPathname.startsWith("/invite/");

      if (isInvitePage) {
        const pendingInvite = sessionStorage.getItem("pendingInvite");
        if (pendingInvite) {
          acceptInvite.mutate(pendingInvite);
          sessionStorage.removeItem("pendingInvite");
        } else {
          acceptInvite.mutate(token);
        }
      }
    }
  }, [
    sessionStatus,
    acceptingInvite,
    acceptInvite.isSuccess,
    acceptInvite,
    token,
  ]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 transition-colors">
        <div className="w-full max-w-md">
          <Card className="rounded-2xl border border-border/80 bg-card p-6 shadow-xl">
            <CardContent className="flex flex-col items-center justify-center p-0 text-center">
              <Loader2 className="size-10 animate-spin text-primary" />
              <h2 className="mt-4 text-lg font-bold tracking-tight text-foreground">
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 transition-colors">
        <div className="w-full max-w-md">
          <Card className="rounded-2xl border border-border/80 bg-card p-6 shadow-xl">
            <CardContent className="flex flex-col items-center justify-center p-0 text-center">
              <div className="rounded-full bg-destructive/10 p-3 text-destructive">
                <AlertCircle className="size-8" />
              </div>
              <h2 className="mt-4 text-lg font-bold tracking-tight text-foreground">
                Invitation Error
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                {error.message}
              </p>
              <Button
                className="mt-6 h-10 active:scale-[0.97] transition-transform duration-150"
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 transition-colors">
        <div className="w-full max-w-md">
          <Card className="rounded-2xl border border-border/80 bg-card p-6 shadow-xl">
            <CardContent className="flex flex-col items-center justify-center p-0 text-center">
              <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="size-8" />
              </div>
              <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">
                Successfully Joined!
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                You have successfully joined the group. Redirecting to workspace...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!invite) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 transition-colors">
      <div className="w-full max-w-md">
        <Card className="rounded-2xl border border-border/80 bg-card p-6 shadow-xl">
          <CardContent className="p-0">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <UserPlus className="size-7" />
              </div>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                Group Invitation
              </h1>

              <p className="mt-1 text-xs text-muted-foreground">
                You&apos;ve been invited to join
              </p>

              <h2 className="mt-2 text-xl font-bold tracking-tight text-primary">
                {invite.group.name}
              </h2>

              <div className="mt-4 flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1">
                {invite.invitedBy.image ? (
                  <Image
                    src={invite.invitedBy.image}
                    alt={invite.invitedBy.name || "User"}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {(invite.invitedBy.name || "U").charAt(0)}
                  </div>
                )}
                <span className="text-xs text-muted-foreground font-medium">
                  Invited by {invite.invitedBy.name}
                </span>
              </div>

              {invite.remainingUses > 0 && (
                <div className="mt-3 text-xs text-muted-foreground">
                  {invite.remainingUses === 1
                    ? "Last spot remaining!"
                    : `${invite.remainingUses} spots remaining`}
                </div>
              )}

              <div className="mt-6 flex w-full flex-col gap-2.5">
                <Button
                  onClick={handleAcceptInvite}
                  disabled={acceptingInvite}
                  className="h-10 w-full font-medium active:scale-[0.97] transition-transform duration-150"
                  size="lg"
                >
                  {acceptingInvite ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Joining...</span>
                    </div>
                  ) : (
                    "Join Group"
                  )}
                </Button>

                <Button
                  onClick={handleRejectInvite}
                  variant="outline"
                  className="h-10 w-full border-border/80 text-muted-foreground hover:text-foreground active:scale-[0.97] transition-transform duration-150"
                  disabled={acceptingInvite}
                >
                  Decline
                </Button>
              </div>

              {sessionStatus === "unauthenticated" && (
                <p className="mt-4 text-xs text-muted-foreground">
                  You&apos;ll need to sign in to join this group
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

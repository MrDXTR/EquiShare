"use client";

import { useState } from "react";
import { ArrowRight, Home } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { MagicCard } from "~/components/ui/magic-card";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/groups" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleHomeClick = () => {
    router.push("/");
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <MagicCard className="rounded-2xl">
          <Card className="border-border/60 bg-card/60 shadow-none">
            <CardContent className="space-y-6">
            {/* Logo/Brand */}
            <div className="text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-muted">
                <Image src="/file.svg" alt="EquiShare" width={40} height={40} />
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                Welcome to EquiShare
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to continue
              </p>
            </div>

            {/* Sign In Form */}
            <div className="space-y-4">
              {/* Google Sign In Button */}
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                size="lg"
                variant="secondary"
                className="w-full"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
                ) : (
                  <>
                    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span className="text-sm font-medium">Continue with Google</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-3 flex items-center">
                <div className="flex-grow border-t border-border/70" />
                <span className="bg-background px-4 text-xs text-muted-foreground">or</span>
                <div className="flex-grow border-t border-border/70" />
              </div>

              {/* Home Button */}
              <Button
                type="button"
                onClick={handleHomeClick}
                size="lg"
                variant="outline"
                className="w-full justify-center text-muted-foreground"
              >
                <Home className="h-4 w-4" />
                <span className="ml-2 font-medium">Back to home</span>
              </Button>
            </div>

            {/* Footer */}
            <div className="pt-2 text-center">
              <p className="text-xs text-muted-foreground">
                By continuing, you acknowledge and accept the EquiShare user
                agreement
              </p>
            </div>
            </CardContent>
          </Card>
        </MagicCard>
      </div>
    </div>
  );
}

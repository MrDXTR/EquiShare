"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Receipt,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { AnimatedGridPattern } from "~/components/ui/animated-grid-pattern";
import { Badge } from "~/components/ui/badge";
import { BentoGrid } from "~/components/ui/bento-grid";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { MorphingText } from "~/components/ui/morphing-text";
import { LoadingScreen } from "./_components/common/LoadingScreen";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/groups");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (status === "authenticated") {
    return null;
  }

  const features = [
    {
      icon: Users,
      title: "Group management",
      description:
        "Create groups for trips, households, or any shared expenses.",
    },
    {
      icon: Receipt,
      title: "Easy expense tracking",
      description: "Add expenses quickly and split them with confidence.",
    },
    {
      icon: TrendingUp,
      title: "Smart calculations",
      description:
        "Automatically calculate who owes what with minimal transactions.",
    },
    {
      icon: CheckCircle2,
      title: "Settlement tracking",
      description: "Keep payments organized and settle debts effortlessly.",
    },
  ];

  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <AnimatedGridPattern
          className="opacity-30"
          maxOpacity={0.12}
          numSquares={32}
          duration={12}
          repeatDelay={1}
        />

        <div className="relative mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl flex-col items-center justify-center px-4 py-10 text-center">
          <div className="space-y-6">
            <Badge
              variant="secondary"
              className="border-border/60 bg-secondary/50"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              The smart way to split bills
            </Badge>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Split Expenses <span className="text-primary">Smarter.</span>
              </h1>

              <MorphingText
                texts={["Smarter", "Simpler", "Faster"]}
                className="mt-2 h-14 max-w-xl text-[2.2rem] md:h-14 md:text-[2.6rem] lg:text-[3rem]"
              />
            </div>

            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Split bills, track expenses, and settle up with friends and family.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={() => router.push("/signin")}>
                Start splitting
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button asChild variant="outline" size="lg">
                <a href="#features">View how it works</a>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                Free to use
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                No ads
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                Instant calculations
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="mx-auto max-w-6xl px-4 py-16 text-center"
      >
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight">
            Everything you need to manage expenses
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Powerful features designed to make splitting as simple as possible.
          </p>
        </div>

        <div className="mt-10">
          <BentoGrid className="auto-rows-min grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border/60 bg-card/50 p-6 text-left transition-colors hover:bg-card"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </BentoGrid>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <Card className="border-border/60 bg-card/50 shadow-none">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Ready to get started?
            </h2>
            <p className="max-w-2xl text-muted-foreground">
              Join thousands of users who have simplified their expense
              sharing experience.
            </p>
            <Button size="lg" onClick={() => router.push("/signin")}>
              Get started now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

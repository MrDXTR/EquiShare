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
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/groups");
    }
  }, [session, status, router]);

  if (status === "authenticated") {
    return null;
  }

  const features = [
    {
      icon: Users,
      title: "Group management",
      description:
        "Create groups for trips, households, or any shared expenses. Everyone stays in the loop.",
      area: "md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]",
    },
    {
      icon: Receipt,
      title: "Easy expense tracking",
      description:
        "Add expenses in seconds. Split equally, by percentage, or custom amounts.",
      area: "md:[grid-area:2/1/3/7] xl:[grid-area:2/1/3/5]",
    },
    {
      icon: TrendingUp,
      title: "Smart calculations",
      description:
        "Automatically minimize the number of transactions needed to settle all debts.",
      area: "md:[grid-area:1/7/3/13] xl:[grid-area:1/5/2/9]",
    },
    {
      icon: CheckCircle2,
      title: "Settlement tracking",
      description:
        "Record payments, track who's settled, and keep a full history of every transaction.",
      area: "md:[grid-area:3/1/4/7] xl:[grid-area:1/9/2/13]",
    },
    {
      icon: Sparkles,
      title: "Always free, no ads",
      description:
        "EquiShare is built to be fair — no paywalls, no distractions, just clarity.",
      area: "md:[grid-area:3/7/4/13] xl:[grid-area:2/5/3/13]",
    },
  ];

  return (
    <div className="bg-background text-foreground transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:40px_40px]"
        />

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="flex flex-col items-center gap-6">
            <Badge
              variant="secondary"
              className="border-border/60 bg-secondary/50 px-3 py-1 font-medium"
            >
              <Sparkles className="mr-1.5 size-3.5 text-primary" />
              The smart way to split bills
            </Badge>

            <div className="flex flex-col items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                Split expenses fairly
              </h1>
              <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                EquiShare keeps every shared bill transparent and fair — from
                weekend getaways to monthly household costs.
              </p>
              <div className="flex items-center justify-center gap-1.5 text-base text-muted-foreground sm:text-lg">
                <span>Perfect for</span>
                <span className="font-semibold text-foreground">trips, roommates, teams, and daily bills</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row w-full sm:w-auto">
              <Button
                size="lg"
                onClick={() => router.push("/signin")}
                className="h-11 w-full sm:w-auto px-6 font-semibold active:scale-[0.97] transition-transform duration-150"
              >
                Start splitting
                <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-11 w-full sm:w-auto px-6 font-medium active:scale-[0.97] transition-transform duration-150 border-border/80"
              >
                <a href="#features">See how it works</a>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-muted-foreground">
              {["Free to use", "No ads", "Instant calculations"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary/70" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Gradient fade — blends grid into the next section */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </section>

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-6xl px-4 pb-8 pt-20">
        <div className="mb-3 flex flex-col items-center gap-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Everything you need for
          </p>
          <h2 className="mx-auto text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            From trips to everyday bills
          </h2>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            Powerful features designed to make splitting as painless as possible.
          </p>
        </div>

        {/* Glowing bento-style feature grid */}
        <div className="mt-10">
          <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:grid-cols-12 xl:grid-rows-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <li
                  key={feature.title}
                  className={`min-h-[13rem] list-none ${feature.area}`}
                >
                  <div className="relative h-full rounded-2xl border border-border/70 p-2 md:rounded-3xl md:p-3 bg-card/40">
                    <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl bg-card/80 p-6 shadow-2xs">
                      <div className="relative flex flex-1 flex-col justify-between gap-3 text-left">
                        <div className="w-fit rounded-lg border border-border/80 bg-primary/10 p-2 text-primary">
                          <Icon className="size-5" />
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="font-sans text-xl font-bold tracking-tight text-foreground text-balance md:text-2xl">
                            {feature.title}
                          </h3>
                          <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-8 sm:py-14 text-center shadow-lg">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Ready to get started?
          </h2>
          <p className="max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Create a group, add your first expense, and let EquiShare handle the rest.
          </p>
          <Button
            size="lg"
            onClick={() => router.push("/signin")}
            className="h-11 px-6 font-semibold active:scale-[0.97] transition-transform duration-150"
          >
            Get started — it&apos;s free
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}

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
import { Button } from "~/components/ui/button";
import { DiaTextReveal } from "~/components/ui/dia-text-reveal";
import { LayoutTextFlip } from "~/components/ui/layout-text-flip";
import { MorphingText } from "~/components/ui/morphing-text";
import { GlowingEffect } from "~/components/ui/glowing-effect";
import { ShineBorder } from "~/components/ui/shine-border";
import { LoadingScreen } from "./_components/common/LoadingScreen";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/groups");
    }
  }, [session, status, router]);

  // if (status === "loading") {
  //   return <LoadingScreen />;
  // }

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

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="flex flex-col items-center gap-6">
            <Badge
              variant="secondary"
              className="border-border/60 bg-secondary/50"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              The smart way to split bills
            </Badge>

            <div className="flex flex-col items-center gap-3">
              <LayoutTextFlip
                text="Split expenses"
                words={["fairly", "instantly", "without awkwardness", "with friends"]}
                duration={2800}
                className="text-3xl md:text-5xl"
              />
              <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                EquiShare keeps every shared bill transparent and fair — from
                weekend getaways to monthly household costs.
              </p>
              {/* DiaTextReveal in its own fixed-height line — no reflow */}
              <div className="flex items-center justify-center gap-1.5 text-base text-muted-foreground sm:text-lg">
                <span>Perfect for</span>
                <DiaTextReveal
                  text={["trips", "roommates", "team events", "daily bills"]}
                  repeat
                  repeatDelay={1.4}
                  duration={1.1}
                  className="font-semibold text-foreground"
                />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={() => router.push("/signin")}>
                Start splitting
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#features">See how it works</a>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Free to use", "No ads", "Instant calculations"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
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
        {/* Morphing text merged as section heading */}
        <div className="mb-3 flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Everything you need for
          </p>
          <MorphingText
            texts={["Trips", "Shared apartments", "Team events", "Everyday bills"]}
            className="mx-auto h-14 max-w-3xl text-[2.2rem] md:h-18 md:text-[2.8rem] lg:text-[3.2rem]"
          />
          <p className="mt-1 max-w-lg text-muted-foreground">
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
                  <div className="relative h-full rounded-2xl border p-2 md:rounded-3xl md:p-3">
                    <GlowingEffect
                      spread={40}
                      glow={true}
                      disabled={false}
                      proximity={64}
                      inactiveZone={0.01}
                    />
                    <div className="border-0.75 relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl bg-card/60 p-6 dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
                      <div className="relative flex flex-1 flex-col justify-between gap-3 text-left">
                        <div className="w-fit rounded-lg border border-gray-600 p-2">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="-tracking-4 pt-0.5 font-sans text-xl font-semibold text-balance md:text-2xl">
                            {feature.title}
                          </h3>
                          <p className="font-sans text-sm text-muted-foreground md:text-base">
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

      {/* CTA Section — ShineBorder */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-2xl bg-card/60 py-14 text-center">
          <ShineBorder
            shineColor={["#9E7AFF", "#FE8BBB", "#60a5fa"]}
            borderWidth={1.5}
            duration={10}
          />
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to get started?
          </h2>
          <p className="max-w-md text-muted-foreground">
            Create a group, add your first expense, and let EquiShare handle the
            rest.
          </p>
          <Button size="lg" onClick={() => router.push("/signin")}>
            Get started — it&apos;s free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}

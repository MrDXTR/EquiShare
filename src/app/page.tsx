"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Users,
  Receipt,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/groups");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900/20 border-t-gray-900"></div>
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  const features = [
    {
      icon: Users,
      title: "Group Management",
      description:
        "Create groups for trips, households, or any shared expenses",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Receipt,
      title: "Easy Expense Tracking",
      description: "Add expenses quickly and split them among group members",
      color: "from-green-500 to-green-600",
    },
    {
      icon: TrendingUp,
      title: "Smart Calculations",
      description:
        "Automatically calculate who owes whom with minimal transactions",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: CheckCircle2,
      title: "Settlement Tracking",
      description: "Keep track of payments and settle debts effortlessly",
      color: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="container flex max-w-6xl flex-col items-center gap-8 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Badge className="border-blue-200 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-4 py-2 text-sm font-medium text-blue-700">
              <Sparkles className="mr-2 h-4 w-4" />
              The Smart Way to Split Bills
            </Badge>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="space-y-4"
          >
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              Split Expenses
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Smarter
              </span>
            </h1>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
              <div className="h-1 w-6 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"></div>
            </div>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="max-w-[48rem] text-xl leading-relaxed text-gray-600 sm:text-2xl sm:leading-9"
          >
            Split bills, track expenses, and settle up with friends and family.
            <span className="font-semibold text-gray-800">
              {" "}
              The easiest way to manage shared expenses.
            </span>
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-8"
          >
            <Button
              size="lg"
              onClick={() => router.push("/signin")}
              className="hover:shadow-3xl transform bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-blue-500/25 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/40"
            >
              Start Splitting Smarter
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-gray-600"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>Free to use</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span>No ads</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500"></div>
              <span>Instant calculations</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <section className="bg-gray-50/30 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              Everything you need to
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {" "}
                manage expenses
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-600">
              Powerful features designed to make splitting expenses as simple as
              possible
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <Card className="h-full border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
                  <CardContent className="space-y-4 p-8 text-center">
                    <div
                      className={`inline-flex rounded-2xl bg-gradient-to-r p-4 ${feature.color} shadow-lg transition-all duration-300 group-hover:shadow-xl`}
                    >
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-blue-700">
                      {feature.title}
                    </h3>
                    <p className="leading-relaxed text-gray-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl text-center"
        >
          <Card className="border-0 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-2xl shadow-blue-500/25">
            <CardContent className="space-y-6 p-12">
              <h2 className="mb-4 text-4xl font-bold text-white">
                Ready to get started?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-xl text-blue-100">
                Join thousands of users who have simplified their expense
                sharing experience
              </p>
              <Button
                size="lg"
                onClick={() => router.push("/signin")}
                className="transform bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-xl transition-all duration-300 hover:scale-105 hover:bg-gray-50 hover:shadow-2xl"
              >
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import {
  Users,
  Receipt,
  Calendar,
  Trash2,
  ChevronRight,
  Share2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { useRouter } from "next/navigation";
import type { RouterOutputs } from "~/trpc/shared";
import { useSession } from "next-auth/react";

type Group = RouterOutputs["group"]["getAll"][number];

interface GroupCardProps {
  group: Group;
  onDelete: (id: string) => void;
  index: number;
}

export function GroupCard({ group, onDelete, index }: GroupCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const totalExpenses =
    group.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
  const recentActivity =
    group.expenses?.length > 0
      ? new Date(
          group.expenses[group.expenses.length - 1]?.createdAt || new Date(),
        ).toLocaleDateString()
      : "No activity";

  // Check if this is a shared group (user is not the creator)
  const isSharedGroup = group.createdById !== session?.user?.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.1 }}
      whileHover={{ y: -2 }}
      className="group relative"
    >
      <Card
        className={`h-full cursor-pointer border bg-background transition-colors duration-200 hover:border-foreground/20 active:scale-[0.99] ${
          isSharedGroup
            ? "border-l-4 border-l-blue-500"
            : "border-l-4 border-l-border"
        }`}
        onClick={() => router.push(`/groups/${group.id}`)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="line-clamp-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-700 sm:text-xl dark:text-gray-100 dark:group-hover:text-blue-400">
                {group.name}
              </CardTitle>

              {isSharedGroup && (
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className="border-border bg-transparent text-xs text-muted-foreground"
                  >
                    <Share2 className="mr-1 h-3 w-3" />
                    Shared with you
                  </Badge>
                </div>
              )}
            </div>

            {!isSharedGroup && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(group.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pb-4">
          {/* Members and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full border border-border p-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">
                {group.people.length}{" "}
                {group.people.length === 1 ? "member" : "members"}
              </span>
            </div>
            <Badge
              variant="outline"
              className="border-border bg-transparent text-xs text-muted-foreground"
            >
              Active
            </Badge>
          </div>

          {/* Expenses Summary */}
          {group.expenses && group.expenses.length > 0 ? (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full border border-border p-1.5">
                      <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {group.expenses.length}{" "}
                      {group.expenses.length === 1 ? "expense" : "expenses"}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-foreground">
                      ₹
                      {totalExpenses.toLocaleString("en-IN", {
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Last: {recentActivity}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <Separator />
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="mb-2 rounded-full border border-border p-3">
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  No expenses yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tap to add your first expense
                </p>
              </div>
            </>
          )}

          {/* View Details Arrow */}
          <div className="flex items-center justify-end pt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100">
              <span>View details</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

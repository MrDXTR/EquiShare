"use client";

import { motion } from "framer-motion";
import { Users, Receipt, Calendar, Trash2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { useRouter } from "next/navigation";
import type { RouterOutputs } from "~/trpc/shared";

type Group = RouterOutputs["group"]["getAll"][number];

interface GroupCardProps {
  group: Group;
  onDelete: (id: string) => void;
  index: number;
}

export function GroupCard({ group, onDelete, index }: GroupCardProps) {
  const router = useRouter();
  const totalExpenses =
    group.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
  const recentActivity =
    group.expenses?.length > 0
      ? new Date(
          group.expenses[group.expenses.length - 1]?.createdAt || new Date(),
        ).toLocaleDateString()
      : "No activity";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative"
    >
      <Card
        className="h-full cursor-pointer border-0 bg-white/90 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-blue-200/30 active:scale-[0.98]"
        onClick={() => router.push(`/groups/${group.id}`)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="line-clamp-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-700 sm:text-xl">
              {group.name}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 opacity-100 hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(group.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pb-4">
          {/* Members and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-blue-100 p-1.5">
                <Users className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {group.people.length}{" "}
                {group.people.length === 1 ? "member" : "members"}
              </span>
            </div>
            <Badge
              variant="outline"
              className="border-green-200 bg-green-50 text-xs text-green-700"
            >
              Active
            </Badge>
          </div>

          {/* Expenses Summary */}
          {group.expenses && group.expenses.length > 0 ? (
            <>
              <Separator className="bg-gray-100" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-green-100 p-1.5">
                      <Receipt className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {group.expenses.length}{" "}
                      {group.expenses.length === 1 ? "expense" : "expenses"}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ₹
                      {totalExpenses.toLocaleString("en-IN", {
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Last: {recentActivity}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <Separator className="bg-gray-100" />
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="mb-2 rounded-full bg-gray-100 p-3">
                  <Receipt className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">
                  No expenses yet
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Tap to add your first expense
                </p>
              </div>
            </>
          )}

          {/* View Details Arrow */}
          <div className="flex items-center justify-end pt-2">
            <div className="flex items-center gap-1 text-xs text-blue-600 opacity-70 transition-opacity group-hover:opacity-100">
              <span>View details</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

"use client";

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
}

export function GroupCard({ group, onDelete }: GroupCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const totalExpenses =
    group.expenses?.reduce(
      (sum: number, expense: any) => sum + expense.amount,
      0,
    ) || 0;

  const recentActivity =
    group.expenses?.length > 0
      ? new Date(
          group.expenses[group.expenses.length - 1]?.createdAt || new Date(),
        ).toLocaleDateString()
      : "No activity";

  const isSharedGroup = group.createdById !== session?.user?.id;

  return (
    <div className="group relative h-full">
      <Card
        className="border-border/70 bg-card relative h-full cursor-pointer rounded-2xl shadow-2xs transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-1 hover:border-border hover:shadow-md active:scale-[0.99]"
        onClick={() => router.push(`/groups/${group.id}`)}
      >
        <CardHeader className="pb-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0 flex-1">
              <CardTitle className="line-clamp-2 text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                {group.name}
              </CardTitle>

              {isSharedGroup && (
                <div>
                  <Badge
                    variant="outline"
                    className="border-border/80 bg-background/60 text-muted-foreground text-[11px] gap-1"
                  >
                    <Share2 className="size-3" />
                    Shared with you
                  </Badge>
                </div>
              )}
            </div>

            {!isSharedGroup && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-[0.96] transition-[transform,color,background-color] duration-150"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(group.id);
                }}
                aria-label="Delete group"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3.5 pb-4">
          {/* Members and Status */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-3.5" />
              <span className="font-medium text-foreground">
                {group.people.length}{" "}
                {group.people.length === 1 ? "participant" : "participants"}
              </span>
            </div>
            <Badge
              variant="outline"
              className="border-border/60 bg-muted/30 text-muted-foreground text-[10px] font-normal"
            >
              Active
            </Badge>
          </div>

          <Separator className="bg-border/60" />

          {/* Expenses Summary */}
          {group.expenses && group.expenses.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Receipt className="size-3.5" />
                  <span className="font-medium">
                    {group.expenses.length}{" "}
                    {group.expenses.length === 1 ? "expense" : "expenses"}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-foreground text-lg font-bold tracking-tight tabular-nums">
                    ₹{totalExpenses.toLocaleString("en-IN", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </div>
                </div>
              </div>

              <div className="text-muted-foreground/80 flex items-center gap-1.5 text-[11px]">
                <Calendar className="size-3" />
                <span>Last activity: {recentActivity}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-3 text-center">
              <Receipt className="mb-1 size-6 text-muted-foreground/30" />
              <p className="text-muted-foreground text-xs font-medium">
                No expenses yet
              </p>
            </div>
          )}

          {/* View Details Arrow */}
          <div className="flex items-center justify-end pt-1">
            <div className="text-muted-foreground group-hover:text-primary flex items-center gap-0.5 text-xs font-medium transition-colors">
              <span>View group</span>
              <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

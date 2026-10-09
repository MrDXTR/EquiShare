"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface SettleAllConfirmationDialogProps {
  onConfirm: () => void;
  isPending: boolean;
  activeSettlementsCount: number;
  onHoverChange?: (hovered: boolean) => void;
}

export function SettleAllConfirmationDialog({
  onConfirm,
  isPending,
  activeSettlementsCount,
  onHoverChange,
}: SettleAllConfirmationDialogProps) {
  const [open, setOpen] = React.useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={isPending || activeSettlementsCount === 0}
          className="h-9 min-w-[118px] px-3.5 rounded-lg text-xs font-medium border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/60 active:scale-[0.96] transition-[transform,background-color,border-color] duration-150 gap-1.5 justify-center"
          onMouseEnter={() => onHoverChange?.(true)}
          onMouseLeave={() => onHoverChange?.(false)}
          onFocus={() => onHoverChange?.(true)}
          onBlur={() => onHoverChange?.(false)}
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="size-3.5" />
          )}
          <span>Settle All ({activeSettlementsCount})</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Confirm Settlement
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            Are you sure you want to mark all {activeSettlementsCount}{" "}
            active {activeSettlementsCount === 1 ? "settlement" : "settlements"} as settled? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 flex gap-2">
          <AlertDialogCancel
            disabled={isPending}
            className="active:scale-[0.97] transition-transform duration-150 border-border/80"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className={cn(
              "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 active:scale-[0.97] transition-transform duration-150 font-medium",
              isPending && "pointer-events-none opacity-50",
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                <span>Settling...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1.5 size-4" />
                <span>Confirm Settle All</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

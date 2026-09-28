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
  // Maintain open state to handle closing after confirmation
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
          className="border-green-300/70 bg-green-50/70 text-green-700 transition-all duration-200 hover:border-green-500 hover:bg-green-100 hover:shadow-[0_0_0_1px_rgba(34,197,94,0.2)] dark:border-green-800 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-800/50"
          onMouseEnter={() => onHoverChange?.(true)}
          onMouseLeave={() => onHoverChange?.(false)}
          onFocus={() => onHoverChange?.(true)}
          onBlur={() => onHoverChange?.(false)}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          <span>Settle All</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            Confirm Settlement
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to mark all {activeSettlementsCount}{" "}
            settlements as settled? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className={cn(
              "bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700",
              isPending && "pointer-events-none opacity-50",
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Settling...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                <span>Confirm</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

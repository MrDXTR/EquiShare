import { Button } from "~/components/ui/button";
import { ArrowRight, CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";

interface FormFooterProps {
  currentStep: number;
  canContinue: boolean;
  formIsValid: boolean;
  isPending: boolean;
  onBack: () => void;
  onContinue: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function FormFooter({
  currentStep,
  canContinue,
  formIsValid,
  isPending,
  onBack,
  onContinue,
  onSubmit,
}: FormFooterProps) {
  return (
    <div className="rounded-b-lg border-t bg-gray-50/80 p-6 dark:bg-gray-950/80">
      <div className="flex justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-10 px-4"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>

        {currentStep < 2 ? (
          <Button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="h-10 bg-blue-600 px-4 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Continue
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={!formIsValid || isPending}
            className="h-10 bg-blue-600 px-4 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Add Expense
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

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
    <div className="border-t border-border/70 bg-card/60 px-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-10 px-4 active:scale-[0.97] transition-transform duration-150 border-border/80"
        >
          <ChevronLeft className="mr-1 size-4" />
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>

        {currentStep < 2 ? (
          <Button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="h-10 px-5 font-medium active:scale-[0.97] transition-transform duration-150"
          >
            <span>Continue</span>
            <ArrowRight className="ml-1.5 size-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={!formIsValid || isPending}
            className="h-10 px-5 font-medium active:scale-[0.97] transition-transform duration-150"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1.5 size-4" />
                Save Expense
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

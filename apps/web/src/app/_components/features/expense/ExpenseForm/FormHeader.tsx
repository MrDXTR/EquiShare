import { CheckCircle2 } from "lucide-react";

interface FormHeaderProps {
  currentStep: number;
}

export function FormHeader({ currentStep }: FormHeaderProps) {
  return (
    <div className="border-b border-border/70 bg-card/60 px-6 py-5">
      <div className="mb-3 flex items-center justify-center">
        {[1, 2].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 ${
                currentStep >= step
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "border border-border/80 bg-background text-muted-foreground"
              }`}
            >
              {currentStep > step ? <CheckCircle2 className="size-4" /> : step}
            </div>
            {step < 2 && (
              <div
                className={`mx-2.5 h-0.5 w-12 transition-all duration-200 ${
                  currentStep > step ? "bg-primary" : "bg-border/60"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="text-center space-y-0.5">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          {currentStep === 1 ? "Expense Details" : "Split Configuration"}
        </h2>
        <p className="text-xs text-muted-foreground">
          {currentStep === 1
            ? "Enter what was spent and who participated"
            : "Customize how the bill is divided"}
        </p>
      </div>
    </div>
  );
}

import { CheckCircle2 } from "lucide-react";

interface FormHeaderProps {
  currentStep: number;
}

export function FormHeader({ currentStep }: FormHeaderProps) {
  return (
    <div className="rounded-t-lg border-b bg-gradient-to-r from-violet-50 to-blue-50 p-6 dark:from-violet-900/20 dark:to-blue-900/20">
      <div className="mb-4 flex items-center justify-center">
        {[1, 2].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-200 ${
                currentStep >= step
                  ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white"
                  : "bg-gray-200 text-gray-500 dark:bg-gray-700"
              } `}
            >
              {currentStep > step ? <CheckCircle2 className="h-4 w-4" /> : step}
            </div>
            {step < 2 && (
              <div
                className={`mx-2 h-0.5 w-12 transition-all duration-200 ${
                  currentStep > step
                    ? "bg-gradient-to-r from-violet-500 to-blue-500"
                    : "bg-gray-200 dark:bg-gray-700"
                } `}
              />
            )}
          </div>
        ))}
      </div>

      <div className="text-center">
        <h2 className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-xl font-bold text-transparent">
          {currentStep === 1 ? "Expense Details" : "Split Configuration"}
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {currentStep === 1
            ? "Enter expense info and select people"
            : "Choose how to split the amount"}
        </p>
      </div>
    </div>
  );
}

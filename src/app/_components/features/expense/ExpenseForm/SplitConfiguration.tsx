import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import {
  AlertTriangle,
  Calculator,
  Check,
  DollarSign,
  Equal,
  IndianRupee,
  Percent,
  RotateCcw,
} from "lucide-react";
import {
  type SplitMode,
  type Person,
  handleSplitModeChange,
  updateShareValueWithAutoAdjust,
  autoBalanceShares,
  calculateCurrentTotals,
  getPersonInitials,
} from "~/app/_components/features/group-management/utils";

interface SplitConfigurationProps {
  people: Person[];
  amount: string;
  splitMode: SplitMode;
  selectedPersonIds: string[];
  shareValues: Record<string, number>;
  formErrors: string | null;
  updateFormState: (updates: Record<string, any>) => void;
}

const splitModeOptions = [
  {
    value: "EQUAL",
    label: "Equal",
    icon: Equal,
    color: "from-green-500 to-emerald-500",
  },
  {
    value: "PERCENT",
    label: "Percent",
    icon: Percent,
    color: "from-blue-500 to-cyan-500",
  },
  {
    value: "EXACT",
    label: "Exact",
    icon: DollarSign,
    color: "from-purple-500 to-pink-500",
  },
] as const;

export function SplitConfiguration({
  people,
  amount,
  splitMode,
  selectedPersonIds,
  shareValues,
  formErrors,
  updateFormState,
}: SplitConfigurationProps) {
  const parsedAmount = parseFloat(amount) || 0;

  const handleSplitModeUpdate = (mode: SplitMode) => {
    const newShareValues = handleSplitModeChange(
      mode,
      selectedPersonIds,
      parsedAmount,
    );

    updateFormState({
      splitMode: mode,
      shareValues: newShareValues,
      formErrors: null,
    });
  };

  const handleShareUpdate = (personId: string, value: number) => {
    const newShareValues = updateShareValueWithAutoAdjust(
      personId,
      value,
      shareValues,
      selectedPersonIds,
      splitMode,
      parsedAmount,
    );

    updateFormState({ shareValues: newShareValues, formErrors: null });
  };

  const handleAutoBalance = () => {
    const newShareValues = autoBalanceShares(
      selectedPersonIds,
      splitMode,
      parsedAmount,
    );

    updateFormState({ shareValues: newShareValues, formErrors: null });
  };

  // Calculate current totals
  const { percentTotal, exactTotal } = calculateCurrentTotals(
    shareValues,
    selectedPersonIds,
    splitMode,
  );

  return (
    <div className="space-y-6">
      {/* Split Mode Selection */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-violet-500" />
          Split Method
        </Label>

        <div className="grid grid-cols-3 gap-3">
          {splitModeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = splitMode === option.value;

            return (
              <motion.button
                key={option.value}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSplitModeUpdate(option.value as SplitMode)}
                className={`relative rounded-lg border-2 p-4 transition-all duration-200 ${
                  isSelected
                    ? "border-violet-400 bg-violet-50 dark:bg-violet-900/30"
                    : "border-gray-200 hover:border-violet-300 dark:border-gray-700"
                } `}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      isSelected
                        ? `bg-gradient-to-r ${option.color} text-white`
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700"
                    } `}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-sm font-medium ${isSelected ? "text-violet-700 dark:text-violet-400" : ""}`}
                  >
                    {option.label}
                  </span>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Error Display */}
      {formErrors && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{formErrors}</span>
        </div>
      )}

      {/* Split Configuration */}
      {splitMode === "EQUAL" ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-900/20">
          <div className="mb-1 text-2xl font-bold text-green-600">
            ₹{(parsedAmount / selectedPersonIds.length).toFixed(2)}
          </div>
          <div className="text-sm text-green-600/80">
            per person ({selectedPersonIds.length} people)
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Total Display & Auto Balance */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
            <div
              className={`text-sm font-medium ${
                (splitMode === "PERCENT" &&
                  Math.abs(percentTotal - 100) < 0.01) ||
                (splitMode === "EXACT" &&
                  Math.abs(exactTotal - parsedAmount) < 0.01)
                  ? "text-green-700 dark:text-green-400"
                  : "text-orange-700 dark:text-orange-400"
              }`}
            >
              {splitMode === "PERCENT"
                ? `${percentTotal.toFixed(1)}% / 100%`
                : `₹${exactTotal.toFixed(2)} / ₹${parsedAmount.toFixed(2)}`}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoBalance}
              className="h-8 border-violet-200 px-3 text-xs text-violet-600 hover:border-violet-300 hover:text-violet-700"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Auto Balance
            </Button>
          </div>

          {/* Individual Share Controls */}
          <div className="max-h-[calc(40vh-20px)] space-y-3 overflow-y-auto pr-1">
            {selectedPersonIds.map((personId) => {
              const person = people.find((p) => p.id === personId);
              if (!person) return null;

              const currentValue = shareValues[personId] || 0;
              const maxValue = splitMode === "PERCENT" ? 100 : parsedAmount;

              return (
                <div
                  key={personId}
                  className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-blue-400 text-xs font-bold text-white">
                        {getPersonInitials(person.name)}
                      </div>
                      <span className="font-medium">{person.name}</span>
                    </div>
                    <span className="font-bold text-violet-600">
                      {splitMode === "PERCENT"
                        ? `${currentValue.toFixed(1)}%`
                        : `₹${currentValue.toFixed(2)}`}
                    </span>
                  </div>

                {splitMode === "PERCENT" ? (
  <Slider
    value={[currentValue]}
    onValueChange={(values) =>
      handleShareUpdate(personId, values[0] || 0)
    }
    max={maxValue}
    step={0.5} 
    className="py-1"
  />
) : (
                    <div className="relative">
                      <IndianRupee className="absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 transform text-gray-400" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max={maxValue}
                        value={currentValue || ""}
                        onChange={(e) =>
                          handleShareUpdate(
                            personId,
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="h-8 pl-8 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

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
  },
  {
    value: "PERCENT",
    label: "Percent",
    icon: Percent,
  },
  {
    value: "EXACT",
    label: "Exact",
    icon: DollarSign,
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
          <Calculator className="h-4 w-4 text-muted-foreground" />
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
                    ? "border-foreground/30 bg-muted/30"
                    : "border-border hover:border-foreground/20"
                } `}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      isSelected
                        ? "border border-foreground bg-foreground text-background"
                        : "border border-border bg-background text-muted-foreground"
                    } `}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-sm font-medium ${isSelected ? "text-foreground" : ""}`}
                  >
                    {option.label}
                  </span>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background">
                    <Check className="h-3 w-3 text-foreground" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Error Display */}
      {formErrors && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-foreground">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{formErrors}</span>
        </div>
      )}

      {/* Split Configuration */}
      {splitMode === "EQUAL" ? (
        <div className="rounded-lg border border-border bg-muted/20 p-4 text-center">
          <div className="mb-1 text-2xl font-semibold text-foreground">
            ₹{(parsedAmount / selectedPersonIds.length).toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">
            per person ({selectedPersonIds.length} people)
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Total Display & Auto Balance */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3">
            <div
              className="text-sm font-medium text-foreground"
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
              className="h-8 px-3 text-xs"
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
                  className="rounded-lg border border-border bg-muted/20 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-xs font-bold text-foreground">
                        {getPersonInitials(person.name)}
                      </div>
                      <span className="font-medium">{person.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">
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

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import {
  AlertTriangle,
  Calculator,
  Check,
  Equal,
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
    desc: "Divide evenly",
  },
  {
    value: "PERCENT",
    label: "Percent",
    icon: Percent,
    desc: "By percentage",
  },
  {
    value: "EXACT",
    label: "Exact",
    icon: () => <span className="font-bold text-sm">₹</span>,
    desc: "Custom amounts",
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

  const { percentTotal, exactTotal } = calculateCurrentTotals(
    shareValues,
    selectedPersonIds,
    splitMode,
  );

  return (
    <div className="space-y-4">
      {/* Split Mode Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Calculator className="size-3.5 text-primary" />
          Split Method
        </Label>

        <div className="grid grid-cols-3 gap-2.5">
          {splitModeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = splitMode === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSplitModeUpdate(option.value as SplitMode)}
                className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-[transform,border-color,background-color] duration-150 active:scale-[0.97] cursor-pointer select-none ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-2xs"
                    : "border-border/70 bg-card/60 hover:bg-card hover:border-border"
                }`}
              >
                <div
                  className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <div>
                  <span
                    className={`block text-xs font-bold ${
                      isSelected ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="hidden sm:block text-[10px] text-muted-foreground">
                    {option.desc}
                  </span>
                </div>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-2.5 stroke-[2.5]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Display */}
      {formErrors && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="font-medium">{formErrors}</span>
        </div>
      )}

      {/* Split Details */}
      {splitMode === "EQUAL" ? (
        <div className="rounded-xl border border-border/70 bg-muted/30 p-4 text-center">
          <div className="text-foreground text-2xl font-bold tracking-tight tabular-nums mb-1">
            ₹{selectedPersonIds.length > 0 ? (parsedAmount / selectedPersonIds.length).toFixed(2) : "0.00"}
          </div>
          <div className="text-muted-foreground text-xs">
            per participant ({selectedPersonIds.length} {selectedPersonIds.length === 1 ? "person" : "people"})
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Total Display & Auto Balance */}
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 px-3.5 py-2.5">
            <div className="text-xs font-semibold tabular-nums text-foreground">
              {splitMode === "PERCENT"
                ? `${percentTotal.toFixed(1)}% / 100%`
                : `₹${exactTotal.toFixed(2)} / ₹${parsedAmount.toFixed(2)}`}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoBalance}
              className="h-7 px-2.5 text-xs active:scale-[0.96] transition-transform duration-150"
            >
              <RotateCcw className="mr-1 size-3" />
              Auto Balance
            </Button>
          </div>

          {/* Individual Share Controls */}
          <div className="max-h-[36vh] space-y-2 overflow-y-auto pr-1">
            {selectedPersonIds.map((personId) => {
              const person = people.find((p) => p.id === personId);
              if (!person) return null;

              const currentValue = shareValues[personId] || 0;
              const maxValue = splitMode === "PERCENT" ? 100 : parsedAmount;

              return (
                <div
                  key={personId}
                  className="rounded-xl border border-border/60 bg-card/60 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg text-xs font-semibold">
                        {getPersonInitials(person.name)}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {person.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-foreground">
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
                      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground text-xs font-semibold">
                        ₹
                      </span>
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
                        className="h-8.5 pl-6 font-mono text-xs tabular-nums rounded-lg border-border/80 bg-background/80"
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

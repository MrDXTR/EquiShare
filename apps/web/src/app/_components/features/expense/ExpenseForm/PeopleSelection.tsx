import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Check, Users } from "lucide-react";
import {
  type Person,
  togglePersonSelection,
  generateShareValues,
  getPersonInitials,
} from "~/app/_components/features/group-management/utils";

interface PeopleSelectionProps {
  people: Person[];
  selectedPersonIds: string[];
  splitMode: "EQUAL" | "PERCENT" | "EXACT";
  amount: string;
  updateFormState: (updates: Record<string, any>) => void;
}

export function PeopleSelection({
  people,
  selectedPersonIds,
  splitMode,
  amount,
  updateFormState,
}: PeopleSelectionProps) {
  const allSelected =
    people.length > 0 && selectedPersonIds.length === people.length;

  const handlePersonToggle = (personId: string) => {
    const { newSelection, newShareValues } = togglePersonSelection(
      personId,
      selectedPersonIds,
      splitMode,
      parseFloat(amount) || 0,
    );

    updateFormState({
      selectedPersonIds: newSelection,
      shareValues: newShareValues,
      formErrors: null,
    });
  };

  const handleSelectAll = () => {
    const allIds = people.map((p) => p.id);
    const newShareValues = generateShareValues(
      splitMode,
      allIds,
      parseFloat(amount) || 0,
    );

    updateFormState({
      selectedPersonIds: allIds,
      shareValues: newShareValues,
      formErrors: null,
    });
  };

  return (
    <div className="space-y-2.5 pb-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Users className="size-3.5 text-primary" />
          Split Between ({selectedPersonIds.length}/{people.length})
        </Label>
        <div className="flex items-center gap-1">
          {!allSelected && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground active:scale-[0.96]"
            >
              Select All
            </Button>
          )}
          {selectedPersonIds.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => updateFormState({ selectedPersonIds: [] })}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive active:scale-[0.96]"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-[36vh] overflow-y-auto pr-1">
        {people.map((person) => {
          const isSelected = selectedPersonIds.includes(person.id);

          return (
            <button
              key={person.id}
              type="button"
              onClick={() => handlePersonToggle(person.id)}
              className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition-[transform,border-color,background-color] duration-150 active:scale-[0.97] cursor-pointer select-none ${isSelected
                  ? "border-primary bg-primary/10 text-foreground shadow-2xs"
                  : "border-border/70 bg-card/60 hover:bg-card hover:border-border text-muted-foreground"
                }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                    }`}
                >
                  {getPersonInitials(person.name)}
                </div>
                <span className="truncate text-xs sm:text-sm font-medium">
                  {person.name}
                </span>
              </div>

              <div
                className={`flex size-4.5 shrink-0 items-center justify-center rounded-md border transition-colors ${isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/80 bg-background"
                  }`}
              >
                {isSelected && <Check className="size-3 stroke-[2.5]" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

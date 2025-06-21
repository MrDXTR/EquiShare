import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Check, UserCheck } from "lucide-react";
import {
  type Person,
  togglePersonSelection,
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

  return (
    <div className="space-y-3 pb-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-violet-500" />
          Split Between ({selectedPersonIds.length} selected)
        </Label>
        {selectedPersonIds.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => updateFormState({ selectedPersonIds: [] })}
            className="text-violet-600 hover:text-violet-700"
          >
            Clear
          </Button>
        )}
      </div>

      <div
        className="grid grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3"
        style={{
          maxHeight: "calc(40vh - 20px)",
          paddingRight: "4px", // Add padding for scrollbar
        }}
      >
        {people.map((person) => {
          const isSelected = selectedPersonIds.includes(person.id);

          return (
            <motion.button
              key={person.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePersonToggle(person.id)}
              className={`rounded-lg border-2 p-3 text-left transition-all duration-200 ${
                isSelected
                  ? "border-violet-400 bg-violet-50 dark:bg-violet-900/30"
                  : "border-gray-200 hover:border-violet-300 dark:border-gray-700"
              } `}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${
                    isSelected
                      ? "bg-gradient-to-br from-violet-500 to-blue-500"
                      : "bg-gray-400"
                  } `}
                >
                  {getPersonInitials(person.name)}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                      <Check className="h-2 w-2 text-white" />
                    </div>
                  )}
                </div>
                <span
                  className={`truncate text-sm font-medium ${isSelected ? "text-violet-700 dark:text-violet-400" : ""}`}
                >
                  {person.name}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

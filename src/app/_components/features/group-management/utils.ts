import type { RouterOutputs } from "~/trpc/shared";

export type Group = RouterOutputs["group"]["getById"];
export type SplitMode = "EQUAL" | "PERCENT" | "EXACT";

export interface PersonShare {
  personId: string;
  type: SplitMode;
  value?: number;
}

export interface FormState {
  description: string;
  amount: string;
  paidById: string;
  selectedPersonIds: string[];
  splitMode: SplitMode;
  shareValues: Record<string, number>;
  formErrors: string | null;
}

export interface Person {
  id: string;
  name: string;
}

// Helper to compute minimal transactions
export function getWhoOwesWhom(
  balances: { person: { id: string; name: string }; balance: number }[],
) {
  const creditors = balances
    .filter((b) => b.balance > 0)
    .map((b) => ({ ...b }));
  const debtors = balances.filter((b) => b.balance < 0).map((b) => ({ ...b }));
  const transactions: { from: string; to: string; amount: number }[] = [];

  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    if (!debtor || !creditor) break;
    const amount = Math.min(-debtor.balance, creditor.balance);
    if (amount > 0) {
      transactions.push({
        from: debtor.person.name,
        to: creditor.person.name,
        amount,
      });
      debtor.balance += amount;
      creditor.balance -= amount;
    }
    if (Math.abs(debtor.balance) < 1e-2) i++;
    if (Math.abs(creditor.balance) < 1e-2) j++;
  }
  return transactions;
}

// Helper to get pending settlements count
export function getPendingSettlementsCount(
  balances:
    | {
        personId: string;
        balance: number;
        person: { id: string; name: string } | undefined;
      }[]
    | null
    | undefined,
) {
  if (!balances) return 0;
  const validBalances = balances.filter((b) => b.person && b.balance !== 0);
  return validBalances.length;
}

// Generate share values for splits
export function generateShareValues(
  splitMode: SplitMode,
  selectedPersonIds: string[],
  totalAmount: number,
): Record<string, number> {
  const newValues: Record<string, number> = {};

  if (splitMode === "EQUAL") {
    return newValues; // Equal split doesn't need individual values
  }

  if (splitMode === "PERCENT") {
    const evenPercent =
      selectedPersonIds.length > 0
        ? Math.floor(100 / selectedPersonIds.length)
        : 0;

    selectedPersonIds.forEach((id, index) => {
      // Give any remainder to the last person
      if (index === selectedPersonIds.length - 1) {
        const totalAssigned = evenPercent * (selectedPersonIds.length - 1);
        newValues[id] = 100 - totalAssigned;
      } else {
        newValues[id] = evenPercent;
      }
    });
  }

  if (splitMode === "EXACT") {
    const evenAmount =
      selectedPersonIds.length > 0 ? totalAmount / selectedPersonIds.length : 0;

    selectedPersonIds.forEach((id) => {
      newValues[id] = Number(evenAmount.toFixed(2));
    });
  }

  return newValues;
}

// Validate split shares
export function validateSplitShares(
  splitMode: SplitMode,
  shareValues: Record<string, number>,
  totalAmount: number,
): { isValid: boolean; errorMessage: string | null } {
  if (splitMode === "EQUAL") {
    return { isValid: true, errorMessage: null };
  }

  if (splitMode === "PERCENT") {
    const totalPercent = Object.values(shareValues).reduce(
      (sum, value) => sum + value,
      0,
    );

    if (Math.abs(totalPercent - 100) > 0.01) {
      return {
        isValid: false,
        errorMessage: "Percentages must add up to 100%",
      };
    }
  }

  if (splitMode === "EXACT") {
    const totalExact = Object.values(shareValues).reduce(
      (sum, value) => sum + value,
      0,
    );

    if (Math.abs(totalExact - totalAmount) > 0.01) {
      return {
        isValid: false,
        errorMessage: `Exact amounts must add up to ₹${totalAmount.toFixed(2)}`,
      };
    }
  }

  return { isValid: true, errorMessage: null };
}

// Initialize form state
export function createInitialFormState(): FormState {
  return {
    description: "",
    amount: "",
    paidById: "",
    selectedPersonIds: [],
    splitMode: "EQUAL",
    shareValues: {},
    formErrors: null,
  };
}

// Handle person selection toggle
export function togglePersonSelection(
  personId: string,
  currentSelection: string[],
  splitMode: SplitMode,
  totalAmount: number,
): {
  newSelection: string[];
  newShareValues: Record<string, number>;
} {
  const newSelection = currentSelection.includes(personId)
    ? currentSelection.filter((id) => id !== personId)
    : [...currentSelection, personId];

  const newShareValues =
    splitMode !== "EQUAL"
      ? generateShareValues(splitMode, newSelection, totalAmount)
      : {};

  return { newSelection, newShareValues };
}

// Handle split mode change
export function handleSplitModeChange(
  newMode: SplitMode,
  selectedPersonIds: string[],
  totalAmount: number,
): Record<string, number> {
  return generateShareValues(newMode, selectedPersonIds, totalAmount);
}

// Enhanced share update with auto-adjustment
export function updateShareValueWithAutoAdjust(
  personId: string,
  value: number,
  currentShareValues: Record<string, number>,
  selectedPersonIds: string[],
  splitMode: SplitMode,
  totalAmount: number,
): Record<string, number> {
  const newShareValues = { ...currentShareValues };

  // Ensure value is valid
  if (isNaN(value) || value < 0) {
    value = 0;
  }

  if (splitMode === "PERCENT") {
    // Ensure percentage doesn't exceed 100%
    value = Math.min(100, value);

    // Round to nearest 0.5
    value = Math.round(value * 2) / 2;

    newShareValues[personId] = value;

    // Calculate current total
    const currentTotal = Object.entries(newShareValues)
      .filter(([id]) => selectedPersonIds.includes(id))
      .reduce((sum, [, val]) => sum + val, 0);

    // If total exceeds 100%, adjust other people's shares
    if (currentTotal > 100) {
      const excess = currentTotal - 100;
      const otherPersonIds = selectedPersonIds.filter((id) => id !== personId);

      if (otherPersonIds.length > 0) {
        // Calculate total of other people's shares
        const otherTotal = otherPersonIds.reduce(
          (sum, id) => sum + (newShareValues[id] || 0),
          0,
        );

        if (otherTotal > 0) {
          // Reduce other people's shares proportionally
          let remainingExcess = excess;

          otherPersonIds.forEach((id, index) => {
            const currentValue = newShareValues[id] || 0;

            if (index === otherPersonIds.length - 1) {
              // Give all remaining excess to the last person
              newShareValues[id] = Math.max(0, currentValue - remainingExcess);
            } else {
              const proportion = currentValue / otherTotal;
              const reduction = Math.min(currentValue, excess * proportion);
              newShareValues[id] = Math.max(0, currentValue - reduction);
              remainingExcess -= reduction;
            }

            // Round to nearest 0.5
            newShareValues[id] = Math.round((newShareValues[id] || 0) * 2) / 2;
          });
        }
      }
    }

    // Final check to ensure total doesn't exceed 100%
    const finalTotal = Object.entries(newShareValues)
      .filter(([id]) => selectedPersonIds.includes(id))
      .reduce((sum, [, val]) => sum + val, 0);

    if (finalTotal > 100) {
      // If still over 100%, reduce the current person's share
      const overAmount = finalTotal - 100;
      newShareValues[personId] = Math.max(
        0,
        newShareValues[personId] - overAmount,
      );
      newShareValues[personId] = Math.round(newShareValues[personId] * 2) / 2;
    }
  } else if (splitMode === "EXACT") {
    // Ensure exact amount doesn't exceed total
    value = Math.min(totalAmount, value);

    // Round to nearest cent
    value = Math.round(value * 100) / 100;

    newShareValues[personId] = value;

    // Calculate current total
    const currentTotal = Object.entries(newShareValues)
      .filter(([id]) => selectedPersonIds.includes(id))
      .reduce((sum, [, val]) => sum + val, 0);

    // If total exceeds the expense amount, adjust other amounts
    if (currentTotal > totalAmount) {
      const excess = currentTotal - totalAmount;
      const otherPersonIds = selectedPersonIds.filter((id) => id !== personId);

      if (otherPersonIds.length > 0) {
        // Calculate total of other people's shares
        const otherTotal = otherPersonIds.reduce(
          (sum, id) => sum + (newShareValues[id] || 0),
          0,
        );

        if (otherTotal > 0) {
          // Reduce other people's shares proportionally
          let remainingExcess = excess;

          otherPersonIds.forEach((id, index) => {
            const currentValue = newShareValues[id] || 0;

            if (index === otherPersonIds.length - 1) {
              // Give all remaining excess to the last person
              newShareValues[id] = Math.max(0, currentValue - remainingExcess);
            } else {
              const proportion = currentValue / otherTotal;
              const reduction = Math.min(currentValue, excess * proportion);
              newShareValues[id] = Math.max(0, currentValue - reduction);
              remainingExcess -= reduction;
            }

            // Round to nearest cent
            newShareValues[id] =
              Math.round((newShareValues[id] || 0) * 100) / 100;
          });
        }
      }
    }

    // Final check to ensure total doesn't exceed totalAmount
    const finalTotal = Object.entries(newShareValues)
      .filter(([id]) => selectedPersonIds.includes(id))
      .reduce((sum, [, val]) => sum + val, 0);

    if (finalTotal > totalAmount) {
      // If still over totalAmount, reduce the current person's share
      const overAmount = finalTotal - totalAmount;
      newShareValues[personId] = Math.max(
        0,
        newShareValues[personId] - overAmount,
      );
      newShareValues[personId] =
        Math.round(newShareValues[personId] * 100) / 100;
    }
  }

  return newShareValues;
}

// Auto-balance function for quick equal distribution
export function autoBalanceShares(
  selectedPersonIds: string[],
  splitMode: SplitMode,
  totalAmount: number,
): Record<string, number> {
  const newShareValues: Record<string, number> = {};

  if (splitMode === "PERCENT") {
    const evenPercent = 100 / selectedPersonIds.length;
    selectedPersonIds.forEach((id, index) => {
      // Give any remainder to the last person
      if (index === selectedPersonIds.length - 1) {
        const totalAssigned = selectedPersonIds
          .slice(0, -1)
          .reduce((sum) => sum + Math.round(evenPercent * 2) / 2, 0);
        newShareValues[id] = Math.round((100 - totalAssigned) * 2) / 2;
      } else {
        newShareValues[id] = Math.round(evenPercent * 2) / 2; // Round to nearest 0.5
      }
    });
  } else if (splitMode === "EXACT") {
    const evenAmount = totalAmount / selectedPersonIds.length;
    selectedPersonIds.forEach((id, index) => {
      // Give any remainder to the last person
      if (index === selectedPersonIds.length - 1) {
        const totalAssigned = selectedPersonIds
          .slice(0, -1)
          .reduce((sum) => sum + Math.round(evenAmount * 100) / 100, 0);
        newShareValues[id] =
          Math.round((totalAmount - totalAssigned) * 100) / 100;
      } else {
        newShareValues[id] = Math.round(evenAmount * 100) / 100; // Round to 2 decimal places
      }
    });
  }

  return newShareValues;
}

// Calculate current totals for display
export function calculateCurrentTotals(
  shareValues: Record<string, number>,
  selectedPersonIds: string[],
  splitMode: SplitMode,
): { percentTotal: number; exactTotal: number } {
  const percentTotal =
    splitMode === "PERCENT"
      ? Object.entries(shareValues)
          .filter(([id]) => selectedPersonIds.includes(id))
          .reduce((sum, [, val]) => sum + val, 0)
      : 0;

  const exactTotal =
    splitMode === "EXACT"
      ? Object.entries(shareValues)
          .filter(([id]) => selectedPersonIds.includes(id))
          .reduce((sum, [, val]) => sum + val, 0)
      : 0;

  return { percentTotal, exactTotal };
}

// Prepare shares for API submission
export function prepareShares(
  selectedPersonIds: string[],
  splitMode: SplitMode,
  shareValues: Record<string, number>,
): PersonShare[] {
  return selectedPersonIds.map((personId) => ({
    personId,
    type: splitMode,
    ...(splitMode !== "EQUAL" && { value: shareValues[personId] || 0 }),
  }));
}

// Check if form is valid for submission
export function isFormValid(
  description: string,
  amount: string,
  paidById: string,
  selectedPersonIds: string[],
): boolean {
  return !!(
    description.trim() &&
    amount &&
    parseFloat(amount) > 0 &&
    paidById &&
    selectedPersonIds.length > 0
  );
}

// Get person initials for avatar
export function getPersonInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

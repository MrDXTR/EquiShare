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
  totalAmount: number
): Record<string, number> {
  const newValues: Record<string, number> = {};
  
  if (splitMode === "EQUAL") {
    return newValues; // Equal split doesn't need individual values
  }
  
  if (splitMode === "PERCENT") {
    const evenPercent = selectedPersonIds.length > 0
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
    const evenAmount = selectedPersonIds.length > 0
      ? totalAmount / selectedPersonIds.length
      : 0;
    
    selectedPersonIds.forEach(id => {
      newValues[id] = Number(evenAmount.toFixed(2));
    });
  }
  
  return newValues;
}

// Validate split shares
export function validateSplitShares(
  splitMode: SplitMode,
  shareValues: Record<string, number>,
  totalAmount: number
): { isValid: boolean; errorMessage: string | null } {
  if (splitMode === "EQUAL") {
    return { isValid: true, errorMessage: null };
  }
  
  if (splitMode === "PERCENT") {
    const totalPercent = Object.values(shareValues)
      .reduce((sum, value) => sum + value, 0);
      
    if (Math.abs(totalPercent - 100) > 0.01) {
      return {
        isValid: false,
        errorMessage: "Percentages must add up to 100%"
      };
    }
  }
  
  if (splitMode === "EXACT") {
    const totalExact = Object.values(shareValues)
      .reduce((sum, value) => sum + value, 0);
      
    if (Math.abs(totalExact - totalAmount) > 0.01) {
      return {
        isValid: false,
        errorMessage: `Exact amounts must add up to ₹${totalAmount.toFixed(2)}`
      };
    }
  }
  
  return { isValid: true, errorMessage: null };
}

// Format share text for display
export function formatShareText(
  splitMode: SplitMode,
  personId: string,
  shareValues: Record<string, number>,
  selectedPersonIds: string[],
  totalAmount: number
): string {
  switch (splitMode) {
    case "EQUAL":
      return `₹${(totalAmount / selectedPersonIds.length).toFixed(2)}`;
    case "PERCENT": 
      const percent = shareValues[personId] || 0;
      const amount = (percent * totalAmount / 100);
      return `${percent.toFixed(0)}% (₹${amount.toFixed(2)})`;
    case "EXACT":
      return `₹${(shareValues[personId] || 0).toFixed(2)}`;
    default:
      return "";
  }
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
  totalAmount: number
): {
  newSelection: string[];
  newShareValues: Record<string, number>;
} {
  const newSelection = currentSelection.includes(personId)
    ? currentSelection.filter((id) => id !== personId)
    : [...currentSelection, personId];
  
  const newShareValues = splitMode !== "EQUAL" 
    ? generateShareValues(splitMode, newSelection, totalAmount)
    : {};
  
  return { newSelection, newShareValues };
}

// Handle split mode change
export function handleSplitModeChange(
  newMode: SplitMode,
  selectedPersonIds: string[],
  totalAmount: number
): Record<string, number> {
  return generateShareValues(newMode, selectedPersonIds, totalAmount);
}

// Update share value with better validation
export function updateShareValue(
  personId: string,
  value: number,
  currentShareValues: Record<string, number>,
  selectedPersonIds: string[],
  splitMode: SplitMode
): Record<string, number> {
  const newValues = { ...currentShareValues };
  
  // Ensure value is valid
  if (isNaN(value) || value < 0) {
    value = 0;
  }
  
  newValues[personId] = value;
  
  // For percentage mode, ensure we don't exceed 100%
  if (splitMode === "PERCENT") {
    const maxAllowed = 100;
    if (value > maxAllowed) {
      newValues[personId] = maxAllowed;
    }
  }
  
  return newValues;
}

// Prepare shares for API submission
export function prepareShares(
  selectedPersonIds: string[],
  splitMode: SplitMode,
  shareValues: Record<string, number>
): PersonShare[] {
  return selectedPersonIds.map(personId => ({
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
  selectedPersonIds: string[]
): boolean {
  return !!(description.trim() && amount && parseFloat(amount) > 0 && paidById && selectedPersonIds.length > 0);
}

// Get person initials for avatar
export function getPersonInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Get step titles
export function getStepTitle(step: number): string {
  switch (step) {
    case 1: return "Expense Details";
    case 2: return "Select People";
    case 3: return "Split Amount";
    default: return "";
  }
}

// Get step descriptions
export function getStepDescription(step: number): string {
  switch (step) {
    case 1: return "What did you spend on?";
    case 2: return "Who should split this expense?";
    case 3: return "How should we divide the cost?";
    default: return "";
  }
}
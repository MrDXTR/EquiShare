import type { RouterOutputs } from "~/trpc/shared";

export type Group = RouterOutputs["group"]["getById"];

export interface Transaction {
  from: string;
  to: string;
  amount: number;
  isSettled?: boolean;
}

// Helper to compute minimal transactions
export function getWhoOwesWhom(
  balances: { person: { id: string; name: string }; balance: number }[],
): Transaction[] {
  const creditors = balances
    .filter((b) => b.balance > 0)
    .map((b) => ({ ...b }));
  const debtors = balances.filter((b) => b.balance < 0).map((b) => ({ ...b }));
  const transactions: Transaction[] = [];

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
        isSettled: false,
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

// Function to track settled transactions
export function trackSettledTransactions(
  transactions: Transaction[],
  settledTransactions: { from: string; to: string; amount: number }[],
): Transaction[] {
  return transactions.map(tx => {
    // Check if this transaction is in the settled list
    const isSettled = settledTransactions.some(
      settledTx => 
        tx.from === settledTx.from && 
        tx.to === settledTx.to && 
        Math.abs(tx.amount - settledTx.amount) < 0.01
    );
    
    // Return a new transaction object with the isSettled flag updated
    return {
      ...tx,
      isSettled: isSettled
    };
  });
}

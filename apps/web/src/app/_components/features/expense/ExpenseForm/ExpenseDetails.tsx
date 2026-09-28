import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { IndianRupee, Receipt, UserCheck } from "lucide-react";
import {
  type Person,
  getPersonInitials,
} from "~/app/_components/features/group-management/utils";
import { PeopleSelection } from "./PeopleSelection";

interface ExpenseDetailsProps {
  people: Person[];
  description: string;
  amount: string;
  paidById: string;
  selectedPersonIds: string[];
  splitMode: "EQUAL" | "PERCENT" | "EXACT";
  updateFormState: (updates: Record<string, any>) => void;
}

export function ExpenseDetails({
  people,
  description,
  amount,
  paidById,
  selectedPersonIds,
  splitMode,
  updateFormState,
}: ExpenseDetailsProps) {
  return (
    <div className="space-y-5">
      {/* Description */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Receipt className="size-3.5 text-primary" />
          Description
        </Label>
        <Input
          value={description}
          onChange={(e) => updateFormState({ description: e.target.value })}
          placeholder="e.g. Dinner, Groceries, Flight tickets..."
          className="h-10.5 rounded-lg border-border/80 bg-background/80"
          autoFocus
        />
      </div>

      {/* Amount & Paid By */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <IndianRupee className="size-3.5 text-primary" />
            Total Amount
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
              ₹
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => updateFormState({ amount: e.target.value })}
              placeholder="0.00"
              className="h-10.5 pl-8 font-mono text-base sm:text-sm font-semibold tabular-nums rounded-lg border-border/80 bg-background/80"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <UserCheck className="size-3.5 text-primary" />
            Paid By
          </Label>
          <Select
            value={paidById}
            onValueChange={(value) => updateFormState({ paidById: value })}
          >
            <SelectTrigger className="h-10.5 w-full rounded-lg border-border/80 bg-background/80">
              <SelectValue placeholder="Who paid the bill?" />
            </SelectTrigger>
            <SelectContent>
              {people.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 text-primary flex size-5.5 items-center justify-center rounded-full text-[10px] font-semibold">
                      {getPersonInitials(person.name)}
                    </div>
                    <span className="text-sm font-medium">{person.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* People Selection */}
      <PeopleSelection
        people={people}
        selectedPersonIds={selectedPersonIds}
        splitMode={splitMode}
        amount={amount}
        updateFormState={updateFormState}
      />
    </div>
  );
}

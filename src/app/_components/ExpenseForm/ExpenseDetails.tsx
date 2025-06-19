import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { IndianRupee, Receipt, Users } from "lucide-react";
import { type Person, getPersonInitials } from "~/app/_components/group/utils";
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
    <div className="space-y-6">
      {/* Description */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-violet-500" />
          Description
        </Label>
        <Input
          value={description}
          onChange={(e) => updateFormState({ description: e.target.value })}
          placeholder="Dinner, groceries, movie..."
          className="h-12"
          autoFocus
        />
      </div>

      {/* Amount & Paid By */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-violet-500" />
            Amount
          </Label>
          <div className="relative">
            <IndianRupee className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => updateFormState({ amount: e.target.value })}
              placeholder="0.00"
              className="h-12 pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-500" />
            Paid By
          </Label>
          <Select
            value={paidById}
            onValueChange={(value) => updateFormState({ paidById: value })}
          >
            <SelectTrigger className="min-h-12 w-full">
              <SelectValue placeholder="Who paid?" />
            </SelectTrigger>
            <SelectContent>
              {people.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-blue-400 text-xs font-semibold text-white">
                      {getPersonInitials(person.name)}
                    </div>
                    {person.name}
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

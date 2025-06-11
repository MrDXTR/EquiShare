"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { useRouter } from "next/navigation";

interface ExpenseFormProps {
  groupId: string;
  people: Array<{ id: string; name: string }>;
}

export function ExpenseForm({ groupId, people }: ExpenseFormProps) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState("");
  const [shareIds, setShareIds] = useState<string[]>([]);

  const createExpense = api.expense.create.useMutation({
    onSuccess: () => {
      setDescription("");
      setAmount("");
      setPaidById("");
      setShareIds([]);
      router.refresh();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paidById || shareIds.length === 0) return;

    createExpense.mutate({
      groupId,
      description,
      amount: parseFloat(amount),
      paidById,
      shareIds,
    });
  };

  const togglePersonShare = (personId: string) => {
    setShareIds((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId],
    );
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Add Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this expense for?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Paid by</Label>
            <Select value={paidById} onValueChange={setPaidById}>
              <SelectTrigger>
                <SelectValue placeholder="Select person" />
              </SelectTrigger>
              <SelectContent>
                {people.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Split among</Label>
            <div className="grid gap-2">
              {people.map((person) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`share-${person.id}`}
                    checked={shareIds.includes(person.id)}
                    onCheckedChange={() => togglePersonShare(person.id)}
                  />
                  <Label
                    htmlFor={`share-${person.id}`}
                    className="text-sm font-normal"
                  >
                    {person.name}
                  </Label>
                </motion.div>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createExpense.isPending}
          >
            {createExpense.isPending ? "Adding..." : "Add Expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 
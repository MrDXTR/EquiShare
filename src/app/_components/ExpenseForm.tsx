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
import { X, Plus, CheckCircle2, IndianRupee } from "lucide-react";
import { Separator } from "~/components/ui/separator";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

interface ExpenseFormProps {
  groupId: string;
  people: Array<{ id: string; name: string }>;
  onClose?: () => void;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function ExpenseForm({
  groupId,
  people,
  onClose,
  onSuccess,
  trigger,
}: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState("");
  const [shareIds, setShareIds] = useState<string[]>([]);
  const utils = api.useUtils();

  const createExpense = api.expense.create.useMutation({
    onMutate: () => {
      toast.loading("Adding expense...", {
        id: "create-expense",
      });
    },
    onSuccess: async () => {
      setDescription("");
      setAmount("");
      setPaidById("");
      setShareIds([]);
      await utils.group.getById.invalidate(groupId);
      await utils.expense.getBalances.invalidate(groupId);
      toast.success("Expense added successfully", {
        id: "create-expense",
      });
      onSuccess?.();
      setOpen(false);
    },
    onError: () => {
      toast.error("Failed to add expense", {
        id: "create-expense",
      });
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

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setPaidById("");
    setShareIds([]);
  };

  const isFormValid = description && amount && paidById && shareIds.length > 0;

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="mx-4 min-w-5xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl">Add New Expense</DialogTitle>
            <DialogDescription className="text-sm">
              Add a new expense to split with your group members.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Description Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-semibold text-gray-700"
                >
                  Description <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this expense for?"
                  className="h-12 border-gray-200 transition-all duration-200 focus:border-blue-500 focus:ring-blue-500/20"
                  required
                  autoFocus
                />
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="amount"
                  className="text-sm font-semibold text-gray-700"
                >
                  Amount (₹) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    id="amount"
                    type="number"
                    step="1"
                    min="0"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-12 border-gray-200 pl-10 transition-all duration-200 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Paid By Selection */}
            <div className="space-y-2">
              <Label
                htmlFor="paidBy"
                className="text-sm font-semibold text-gray-700"
              >
                Paid by <span className="text-red-500">*</span>
              </Label>
              <Select value={paidById} onValueChange={setPaidById}>
                <SelectTrigger className="h-12 w-full">
                  <SelectValue placeholder="Select who paid" />
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

            <Separator />

            {/* Split Between */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-gray-700">
                Split between ({shareIds.length} selected)
              </Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {people.map((person) => {
                  const isSelected = shareIds.includes(person.id);
                  return (
                    <motion.label
                      key={person.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                        isSelected
                          ? "border-blue-500 bg-blue-50/50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => togglePersonShare(person.id)}
                        className="h-5 w-5"
                      />
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white ${
                            isSelected ? "bg-blue-500" : "bg-gray-400"
                          }`}
                        >
                          {person.name.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className={`font-medium ${isSelected ? "text-blue-700" : "text-gray-700"}`}
                        >
                          {person.name}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="ml-auto h-5 w-5 text-blue-500" />
                      )}
                    </motion.label>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto"
              disabled={createExpense.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || createExpense.isPending}
              className={`w-full sm:w-auto ${
                isFormValid
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg hover:from-green-700 hover:to-emerald-700 hover:shadow-xl"
                  : "cursor-not-allowed bg-gray-300"
              } transition-all duration-300`}
            >
              {createExpense.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Adding...
                </div>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

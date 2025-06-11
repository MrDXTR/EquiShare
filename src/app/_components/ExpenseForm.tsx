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

interface ExpenseFormProps {
  groupId: string;
  people: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ExpenseForm({
  groupId,
  people,
  onClose,
  onSuccess,
}: ExpenseFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState("");
  const [shareIds, setShareIds] = useState<string[]>([]);
  const utils = api.useUtils();

  const createExpense = api.expense.create.useMutation({
    onSuccess: async () => {
      setDescription("");
      setAmount("");
      setPaidById("");
      setShareIds([]);
      await utils.group.getById.invalidate(groupId);
      await utils.expense.getBalances.invalidate(groupId);
      onSuccess?.();
      onClose();
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

  const isFormValid = description && amount && paidById && shareIds.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="relative"
    >
      <Card className="border-0 bg-white/80 shadow-2xl shadow-blue-100/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 p-2">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Add New Expense
              </span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Description Input */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-semibold text-gray-700"
              >
                Description *
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this expense for?"
                className="h-12 border-gray-200 transition-all duration-200 focus:border-blue-500 focus:ring-blue-500/20"
                required
              />
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label
                htmlFor="amount"
                className="text-sm font-semibold text-gray-700"
              >
                Amount (₹) *
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
              Paid by *
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

          <Separator className="my-6" />

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

          <Separator className="my-6" />

          {/* Action Buttons */}
          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={onClose}
              className="order-2 border-gray-300 hover:bg-gray-50 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || createExpense.isPending}
              className={`order-1 sm:order-2 ${
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

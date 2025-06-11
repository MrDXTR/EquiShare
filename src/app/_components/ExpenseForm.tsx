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
import { X, Plus, DollarSign, CheckCircle2, IndianRupee } from "lucide-react";
import { Separator } from "~/components/ui/separator";

interface ExpenseFormProps {
  groupId: string;
  people: Array<{ id: string; name: string }>;
  onClose: () => void;
}

export function ExpenseForm({ groupId, people, onClose }: ExpenseFormProps) {
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
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl shadow-blue-100/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Add New Expense
              </span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Description Input */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                Description *
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this expense for?"
                className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                required
              />
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-semibold text-gray-700">
                Amount (₹) *
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-12 pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                  required
                />
              </div>
            </div>
          </div>

          {/* Paid By Selection */}
          <div className="space-y-2">
            <Label htmlFor="paidBy" className="text-sm font-semibold text-gray-700">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {people.map((person) => {
                const isSelected = shareIds.includes(person.id);
                return (
                  <motion.label
                    key={person.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => togglePersonShare(person.id)}
                      className="w-5 h-5"
                    />
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                        isSelected ? 'bg-blue-500' : 'bg-gray-400'
                      }`}>
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                        {person.name}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-blue-500 ml-auto" />
                    )}
                  </motion.label>
                );
              })}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="order-2 sm:order-1 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid || createExpense.isPending}
              className={`order-1 sm:order-2 ${
                isFormValid
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 cursor-not-allowed'
              } transition-all duration-300`}
            >
              {createExpense.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </div>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
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
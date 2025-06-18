"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import {
  IndianRupee,
  Loader2,
  Plus,
  Users,
  Calculator,
  Check,
  AlertTriangle,
  ChevronLeft,
  ArrowRight,
  Receipt,
  UserCheck,
  Percent,
  DollarSign,
  Equal,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { Slider } from "~/components/ui/slider";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  type SplitMode,
  type Person,
  type FormState,
  createInitialFormState,
  togglePersonSelection,
  handleSplitModeChange,
  updateShareValueWithAutoAdjust,
  autoBalanceShares,
  calculateCurrentTotals,
  validateSplitShares,
  prepareShares,
  isFormValid,
  getPersonInitials,
} from "~/app/_components/group/utils";

interface ExpenseFormProps {
  groupId: string;
  people: Person[];
  onClose?: () => void;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const splitModeOptions = [
  {
    value: "EQUAL",
    label: "Equal",
    icon: Equal,
    color: "from-green-500 to-emerald-500",
  },
  {
    value: "PERCENT",
    label: "Percent",
    icon: Percent,
    color: "from-blue-500 to-cyan-500",
  },
  {
    value: "EXACT",
    label: "Exact",
    icon: DollarSign,
    color: "from-purple-500 to-pink-500",
  },
] as const;

export function ExpenseForm({
  groupId,
  people,
  onClose,
  onSuccess,
  trigger,
}: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>(
    createInitialFormState(),
  );
  const [currentStep, setCurrentStep] = useState(1);

  const utils = api.useUtils();

  const createExpense = api.expense.create.useMutation({
    onMutate: () => {
      toast.loading("Adding expense...", { id: "create-expense" });
    },
    onSuccess: async () => {
      resetForm();
      await utils.group.getById.invalidate(groupId);
      await utils.expense.getBalances.invalidate(groupId);
      toast.success("Expense added!", { id: "create-expense" });
      onSuccess?.();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`, { id: "create-expense" });
    },
  });

  const resetForm = () => {
    setFormState(createInitialFormState());
    setCurrentStep(1);
  };

  const updateFormState = (updates: Partial<FormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  };

  const handlePersonToggle = (personId: string) => {
    const { newSelection, newShareValues } = togglePersonSelection(
      personId,
      formState.selectedPersonIds,
      formState.splitMode,
      parseFloat(formState.amount) || 0,
    );

    updateFormState({
      selectedPersonIds: newSelection,
      shareValues: newShareValues,
      formErrors: null,
    });
  };

  const handleSplitModeUpdate = (mode: SplitMode) => {
    const newShareValues = handleSplitModeChange(
      mode,
      formState.selectedPersonIds,
      parseFloat(formState.amount) || 0,
    );

    updateFormState({
      splitMode: mode,
      shareValues: newShareValues,
      formErrors: null,
    });
  };

  const handleShareUpdate = (personId: string, value: number) => {
    const parsedAmount = parseFloat(formState.amount) || 0;
    const newShareValues = updateShareValueWithAutoAdjust(
      personId,
      value,
      formState.shareValues,
      formState.selectedPersonIds,
      formState.splitMode,
      parsedAmount,
    );

    updateFormState({ shareValues: newShareValues, formErrors: null });
  };

  const handleAutoBalance = () => {
    const parsedAmount = parseFloat(formState.amount) || 0;
    const newShareValues = autoBalanceShares(
      formState.selectedPersonIds,
      formState.splitMode,
      parsedAmount,
    );

    updateFormState({ shareValues: newShareValues, formErrors: null });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(formState.amount);
    const validation = validateSplitShares(
      formState.splitMode,
      formState.shareValues,
      parsedAmount,
    );

    if (!validation.isValid) {
      updateFormState({ formErrors: validation.errorMessage });
      return;
    }

    const shares = prepareShares(
      formState.selectedPersonIds,
      formState.splitMode,
      formState.shareValues,
    );

    createExpense.mutate({
      groupId,
      description: formState.description,
      amount: parsedAmount,
      paidById: formState.paidById,
      shares,
    });
  };

  const parsedAmount = parseFloat(formState.amount) || 0;
  const formIsValid = isFormValid(
    formState.description,
    formState.amount,
    formState.paidById,
    formState.selectedPersonIds,
  );

  const canGoNext = () => {
    return currentStep === 1
      ? formState.description.trim() &&
          formState.amount &&
          formState.paidById &&
          formState.selectedPersonIds.length > 0
      : formIsValid;
  };

  // Calculate current totals
  const { percentTotal, exactTotal } = calculateCurrentTotals(
    formState.shareValues,
    formState.selectedPersonIds,
    formState.splitMode,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-2xl flex-col gap-0 p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Add Expense - Step {currentStep}</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="border-b bg-gradient-to-r from-violet-50 to-blue-50 p-6 dark:from-violet-900/20 dark:to-blue-900/20">
          <div className="mb-4 flex items-center justify-center">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-200 ${
                    currentStep >= step
                      ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white"
                      : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                  } `}
                >
                  {currentStep > step ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    step
                  )}
                </div>
                {step < 2 && (
                  <div
                    className={`mx-2 h-0.5 w-12 transition-all duration-200 ${
                      currentStep > step
                        ? "bg-gradient-to-r from-violet-500 to-blue-500"
                        : "bg-gray-200 dark:bg-gray-700"
                    } `}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            <h2 className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-xl font-bold text-transparent">
              {currentStep === 1 ? "Expense Details" : "Split Configuration"}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {currentStep === 1
                ? "Enter expense info and select people"
                : "Choose how to split the amount"}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-6">
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {/* Step 1: Details & People */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Description */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-violet-500" />
                        Description
                      </Label>
                      <Input
                        value={formState.description}
                        onChange={(e) =>
                          updateFormState({ description: e.target.value })
                        }
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
                            value={formState.amount}
                            onChange={(e) =>
                              updateFormState({ amount: e.target.value })
                            }
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
                          value={formState.paidById}
                          onValueChange={(value) =>
                            updateFormState({ paidById: value })
                          }
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
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-violet-500" />
                          Split Between ({
                            formState.selectedPersonIds.length
                          }{" "}
                          selected)
                        </Label>
                        {formState.selectedPersonIds.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateFormState({ selectedPersonIds: [] })
                            }
                            className="text-violet-600 hover:text-violet-700"
                          >
                            Clear
                          </Button>
                        )}
                      </div>

                      <div className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                        {people.map((person) => {
                          const isSelected =
                            formState.selectedPersonIds.includes(person.id);

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
                  </motion.div>
                )}

                {/* Step 2: Split Configuration */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Split Mode Selection */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-violet-500" />
                        Split Method
                      </Label>

                      <div className="grid grid-cols-3 gap-3">
                        {splitModeOptions.map((option) => {
                          const Icon = option.icon;
                          const isSelected =
                            formState.splitMode === option.value;

                          return (
                            <motion.button
                              key={option.value}
                              type="button"
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                                handleSplitModeUpdate(option.value)
                              }
                              className={`relative rounded-lg border-2 p-4 transition-all duration-200 ${
                                isSelected
                                  ? "border-violet-400 bg-violet-50 dark:bg-violet-900/30"
                                  : "border-gray-200 hover:border-violet-300 dark:border-gray-700"
                              } `}
                            >
                              <div className="flex flex-col items-center gap-2">
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                    isSelected
                                      ? `bg-gradient-to-r ${option.color} text-white`
                                      : "bg-gray-100 text-gray-600 dark:bg-gray-700"
                                  } `}
                                >
                                  <Icon className="h-5 w-5" />
                                </div>
                                <span
                                  className={`text-sm font-medium ${isSelected ? "text-violet-700 dark:text-violet-400" : ""}`}
                                >
                                  {option.label}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Error Display */}
                    {formState.formErrors && (
                      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">{formState.formErrors}</span>
                      </div>
                    )}

                    {/* Split Configuration */}
                    {formState.splitMode === "EQUAL" ? (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-900/20">
                        <div className="mb-1 text-2xl font-bold text-green-600">
                          ₹
                          {(
                            parsedAmount / formState.selectedPersonIds.length
                          ).toFixed(2)}
                        </div>
                        <div className="text-sm text-green-600/80">
                          per person ({formState.selectedPersonIds.length}{" "}
                          people)
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Total Display & Auto Balance */}
                        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                          <div
                            className={`text-sm font-medium ${
                              (formState.splitMode === "PERCENT" &&
                                Math.abs(percentTotal - 100) < 0.01) ||
                              (formState.splitMode === "EXACT" &&
                                Math.abs(exactTotal - parsedAmount) < 0.01)
                                ? "text-green-700 dark:text-green-400"
                                : "text-orange-700 dark:text-orange-400"
                            }`}
                          >
                            {formState.splitMode === "PERCENT"
                              ? `${percentTotal.toFixed(1)}% / 100%`
                              : `₹${exactTotal.toFixed(2)} / ₹${parsedAmount.toFixed(2)}`}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAutoBalance}
                            className="h-8 border-violet-200 px-3 text-xs text-violet-600 hover:border-violet-300 hover:text-violet-700"
                          >
                            <RotateCcw className="mr-1 h-3 w-3" />
                            Auto Balance
                          </Button>
                        </div>

                        {/* Individual Share Controls */}
                        <div className="max-h-60 space-y-3 overflow-y-auto">
                          {formState.selectedPersonIds.map((personId) => {
                            const person = people.find(
                              (p) => p.id === personId,
                            );
                            if (!person) return null;

                            const currentValue =
                              formState.shareValues[personId] || 0;
                            const maxValue =
                              formState.splitMode === "PERCENT"
                                ? 100
                                : parsedAmount;

                            return (
                              <div
                                key={personId}
                                className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                              >
                                <div className="mb-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-blue-400 text-xs font-bold text-white">
                                      {getPersonInitials(person.name)}
                                    </div>
                                    <span className="font-medium">
                                      {person.name}
                                    </span>
                                  </div>
                                  <span className="font-bold text-violet-600">
                                    {formState.splitMode === "PERCENT"
                                      ? `${currentValue.toFixed(1)}%`
                                      : `₹${currentValue.toFixed(2)}`}
                                  </span>
                                </div>

                                {formState.splitMode === "PERCENT" ? (
                                  <Slider
                                    value={[currentValue]}
                                    onValueChange={(values) =>
                                      handleShareUpdate(
                                        personId,
                                        values[0] || 0,
                                      )
                                    }
                                    max={maxValue}
                                    step={0.1}
                                    className="py-1"
                                  />
                                ) : (
                                  <div className="relative">
                                    <IndianRupee className="absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 transform text-gray-400" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max={maxValue}
                                      value={currentValue || ""}
                                      onChange={(e) =>
                                        handleShareUpdate(
                                          personId,
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="h-8 pl-8 text-sm"
                                      placeholder="0.00"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50/80 p-6 dark:bg-gray-800/80">
          <div className="flex justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                currentStep > 1 ? setCurrentStep(1) : setOpen(false)
              }
              className="h-10 px-4"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {currentStep === 1 ? "Cancel" : "Back"}
            </Button>

            {currentStep < 2 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!canGoNext()}
                className="h-10 bg-gradient-to-r from-violet-500 to-blue-500 px-4 hover:from-violet-600 hover:to-blue-600 dark:text-white"
              >
                Continue
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={!formIsValid || createExpense.isPending}
                className="h-10 bg-gradient-to-r from-violet-500 to-blue-500 px-4 hover:from-violet-600 hover:to-blue-600 dark:text-white"
              >
                {createExpense.isPending ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Add Expense
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

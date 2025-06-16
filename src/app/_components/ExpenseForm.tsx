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
  X,
  AlertTriangle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Receipt
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
  updateShareValue,
  validateSplitShares,
  formatShareText,
  prepareShares,
  isFormValid,
  getPersonInitials,
  getStepTitle,
  getStepDescription
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
    label: "Equal Split", 
    icon: "=", 
    shortLabel: "Equal",
    description: "Everyone pays the same amount"
  },
  { 
    value: "PERCENT", 
    label: "Percentage", 
    icon: "%", 
    shortLabel: "%",
    description: "Split by percentage"
  },
  { 
    value: "EXACT", 
    label: "Exact Amount", 
    icon: "₹", 
    shortLabel: "₹",
    description: "Specify exact amounts"
  }
] as const;

export function ExpenseForm({
  groupId,
  people,
  onClose,
  onSuccess,
  trigger,
}: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>(createInitialFormState());
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
      toast.success("Expense added successfully!", { id: "create-expense" });
      onSuccess?.();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to add expense: ${error.message}`, { id: "create-expense" });
    },
  });

  const resetForm = () => {
    setFormState(createInitialFormState());
    setCurrentStep(1);
  };

  const updateFormState = (updates: Partial<FormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  };

  const handlePersonToggle = (personId: string) => {
    const { newSelection, newShareValues } = togglePersonSelection(
      personId,
      formState.selectedPersonIds,
      formState.splitMode,
      parseFloat(formState.amount) || 0
    );
    
    updateFormState({
      selectedPersonIds: newSelection,
      shareValues: newShareValues,
      formErrors: null
    });
  };

  const handleSplitModeUpdate = (mode: SplitMode) => {
    const newShareValues = handleSplitModeChange(
      mode,
      formState.selectedPersonIds,
      parseFloat(formState.amount) || 0
    );
    
    updateFormState({
      splitMode: mode,
      shareValues: newShareValues,
      formErrors: null
    });
  };

  const handleShareUpdate = (personId: string, value: number) => {
    const newShareValues = updateShareValue(
      personId,
      value,
      formState.shareValues,
      formState.selectedPersonIds,
      formState.splitMode
    );
    
    updateFormState({ shareValues: newShareValues, formErrors: null });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(formState.amount);
    const validation = validateSplitShares(
      formState.splitMode,
      formState.shareValues,
      parsedAmount
    );
    
    if (!validation.isValid) {
      updateFormState({ formErrors: validation.errorMessage });
      return;
    }
    
    const shares = prepareShares(
      formState.selectedPersonIds,
      formState.splitMode,
      formState.shareValues
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
    formState.selectedPersonIds
  );

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return formState.description.trim() && formState.amount && formState.paidById;
      case 2:
        return formState.selectedPersonIds.length > 0;
      case 3:
        return formIsValid;
      default:
        return false;
    }
  };

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
          <Button className="group relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 hover:from-violet-700 hover:via-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Plus className="mr-2 h-4 w-4" />
            <span className="font-medium">Add Expense</span>
            <Sparkles className="ml-2 h-4 w-4 opacity-70" />
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-2xl h-[90vh] max-h-[600px] flex flex-col p-0 gap-0 bg-white dark:bg-gray-900">
        {/* Fixed Header */}
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 border-b bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                {getStepTitle(currentStep)}
              </DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {getStepDescription(currentStep)}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 bg-white/60 dark:bg-gray-800/60 px-3 py-1 rounded-full">
              <Receipt className="h-3 w-3 sm:h-4 sm:w-4" />
              Step {currentStep} of 3
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Progress</span>
              <span>{Math.round((currentStep / 3) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-violet-500 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {/* Step 1: Basic Details */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Receipt className="h-4 w-4" />
                          What's this expense for? *
                        </Label>
                        <Input
                          value={formState.description}
                          onChange={(e) => updateFormState({ description: e.target.value })}
                          placeholder="Dinner, groceries, movie tickets..."
                          className="h-12 bg-white/70 dark:bg-gray-800/70 border-2 focus:border-violet-400 transition-all duration-200 text-base"
                          autoFocus
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <IndianRupee className="h-4 w-4" />
                          Total Amount *
                        </Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formState.amount}
                            onChange={(e) => updateFormState({ amount: e.target.value })}
                            placeholder="0.00"
                            className="h-12 pl-10 bg-white/70 dark:bg-gray-800/70 border-2 focus:border-violet-400 transition-all duration-200 text-base"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Who paid for this? *
                        </Label>
                        <Select value={formState.paidById} onValueChange={(value) => updateFormState({ paidById: value })}>
                          <SelectTrigger className="h-12 w-full bg-white/70 dark:bg-gray-800/70 border-2 focus:border-violet-400 text-base">
                            <SelectValue placeholder="Select the person who paid" />
                          </SelectTrigger>
                          <SelectContent>
                            {people.map((person) => (
                              <SelectItem key={person.id} value={person.id}>
                                <div className="flex items-center gap-3 py-1">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-blue-400 flex items-center justify-center text-white text-sm font-semibold">
                                    {getPersonInitials(person.name)}
                                  </div>
                                  <span className="truncate max-w-[200px]">{person.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: People Selection */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-violet-600" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Select People
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                        {formState.selectedPersonIds.length} selected
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {people.map((person) => {
                        const isSelected = formState.selectedPersonIds.includes(person.id);
                        
                        return (
                          <motion.div
                            key={person.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handlePersonToggle(person.id)}
                            className={`
                              relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-300
                              ${isSelected 
                                ? 'border-violet-400 bg-gradient-to-br from-violet-50 to-blue-50 shadow-lg dark:from-violet-900/20 dark:to-blue-900/20 dark:border-violet-500' 
                                : 'border-gray-200 bg-white/50 hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/50'
                              }
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all duration-300
                                ${isSelected 
                                  ? 'bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg' 
                                  : 'bg-gray-400 dark:bg-gray-600'
                                }
                              `}>
                                {getPersonInitials(person.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium truncate ${isSelected ? 'text-violet-700 dark:text-violet-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {person.name}
                                </p>
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0"
                                >
                                  <Check className="h-4 w-4 text-white" />
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Split Configuration */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-violet-600" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Split ₹{parsedAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Split Mode Selection */}
                    <div className="grid grid-cols-3 gap-3">
                      {splitModeOptions.map((option) => (
                        <motion.button
                          key={option.value}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSplitModeUpdate(option.value)}
                          className={`
                            p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 text-center
                            ${formState.splitMode === option.value
                              ? 'border-violet-400 bg-gradient-to-br from-violet-50 to-blue-50 shadow-lg dark:from-violet-900/20 dark:to-blue-900/20 dark:border-violet-500'
                              : 'border-gray-200 bg-white/50 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/50'
                            }
                          `}
                        >
                          <div className={`text-xl sm:text-2xl font-bold mb-1 ${formState.splitMode === option.value ? 'text-violet-600' : 'text-gray-400'}`}>
                            {option.icon}
                          </div>
                          <p className={`text-xs sm:text-sm font-medium ${formState.splitMode === option.value ? 'text-violet-700 dark:text-violet-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            <span className="hidden sm:inline">{option.label}</span>
                            <span className="sm:hidden">{option.shortLabel}</span>
                          </p>
                        </motion.button>
                      ))}
                    </div>

                    {/* Error Display */}
                    {formState.formErrors && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                      >
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{formState.formErrors}</span>
                      </motion.div>
                    )}

                    {/* Share Inputs for Non-Equal Splits */}
                    {formState.splitMode !== "EQUAL" && (
                      <div className="space-y-4">
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Adjust {formState.splitMode === "PERCENT" ? "percentages" : "amounts"}:
                        </Label>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {formState.selectedPersonIds.map((personId) => {
                            const person = people.find(p => p.id === personId);
                            if (!person) return null;
                            
                            return (
                              <div key={personId} className="p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg border">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {getPersonInitials(person.name)}
                                  </div>
                                  <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{person.name}</span>
                                </div>
                                
                                {formState.splitMode === "PERCENT" ? (
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">Percentage</span>
                                      <span className="font-semibold text-violet-600">{(formState.shareValues[personId] || 0).toFixed(0)}%</span>
                                    </div>
                                    <Slider
                                      value={[formState.shareValues[personId] || 0]}
                                      onValueChange={(values) => handleShareUpdate(personId, values[0] || 0)}
                                      max={100}
                                      step={1}
                                      className="py-2"
                                    />
                                    <p className="text-xs text-gray-500 text-center">
                                      ₹{((formState.shareValues[personId] || 0) * parsedAmount / 100).toFixed(2)}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <Label className="text-sm text-gray-600 dark:text-gray-400">Amount</Label>
                                    <div className="relative">
                                      <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formState.shareValues[personId] || ""}
                                        onChange={(e) => handleShareUpdate(personId, parseFloat(e.target.value) || 0)}
                                        className="pl-8 h-10 text-base"
                                        placeholder="0.00"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Summary for Equal Splits */}
                    {formState.splitMode === "EQUAL" && formState.selectedPersonIds.length > 0 && (
                      <div className="bg-white/70 dark:bg-gray-800/70 p-6 rounded-xl border">
                        <p className="text-center text-gray-700 dark:text-gray-300 mb-4">
                          Each person pays the same:
                        </p>
                        <div className="text-center">
                          <span className="text-3xl font-bold text-violet-600">
                            ₹{(parsedAmount / formState.selectedPersonIds.length).toFixed(2)}
                          </span>
                          <p className="text-sm text-gray-600 mt-2">
                            ({formState.selectedPersonIds.length} people sharing equally)
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-t bg-gray-50 dark:bg-gray-800/50">
          <div className="flex justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : setOpen(false)}
              className="h-11 flex-shrink-0"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {currentStep === 1 ? "Cancel" : "Back"}
            </Button>
            
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canGoNext()}
                className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 h-11 flex-1 min-w-0"
              >
                <span className="truncate">Next</span>
                <ChevronRight className="ml-2 h-4 w-4 flex-shrink-0" />
              </Button>
            ) : (
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={!formIsValid || createExpense.isPending}
                className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 h-11 flex-1 min-w-0"
              >
                {createExpense.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
                    <span className="truncate">Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Save Expense</span>
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
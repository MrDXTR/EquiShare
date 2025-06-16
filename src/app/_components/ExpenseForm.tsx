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
  Receipt,
  Search,
  UserCheck,
  Percent,
  DollarSign,
  Equal,
  ArrowRight,
  CheckCircle2
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
    icon: Equal, 
    shortLabel: "Equal",
    description: "Everyone pays the same amount",
    color: "from-green-500 to-emerald-500"
  },
  { 
    value: "PERCENT", 
    label: "Percentage", 
    icon: Percent, 
    shortLabel: "%",
    description: "Split by percentage",
    color: "from-blue-500 to-cyan-500"
  },
  { 
    value: "EXACT", 
    label: "Exact Amount", 
    icon: DollarSign, 
    shortLabel: "₹",
    description: "Specify exact amounts",
    color: "from-purple-500 to-pink-500"
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
  const [searchQuery, setSearchQuery] = useState("");
  
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
    setSearchQuery("");
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

  // Enhanced share update with auto-adjustment
  const handleShareUpdate = (personId: string, value: number) => {
    const parsedAmount = parseFloat(formState.amount) || 0;
    const newShareValues = { ...formState.shareValues };
    
    if (formState.splitMode === "PERCENT") {
      // Ensure percentage doesn't exceed 100%
      const maxAllowed = Math.min(100, value);
      newShareValues[personId] = maxAllowed;
      
      // Auto-adjust other percentages if total exceeds 100%
      const currentTotal = Object.entries(newShareValues)
        .filter(([id]) => formState.selectedPersonIds.includes(id))
        .reduce((sum, [, val]) => sum + val, 0);
      
      if (currentTotal > 100) {
        const excess = currentTotal - 100;
        const otherPersonIds = formState.selectedPersonIds.filter(id => id !== personId);
        
        if (otherPersonIds.length > 0) {
          // Distribute the excess reduction proportionally among other people
          const otherTotal = otherPersonIds.reduce((sum, id) => sum + (newShareValues[id] || 0), 0);
          
          if (otherTotal > 0) {
            otherPersonIds.forEach(id => {
              const currentValue = newShareValues[id] || 0;
              const proportion = currentValue / otherTotal;
              const reduction = excess * proportion;
              newShareValues[id] = Math.max(0, currentValue - reduction);
            });
          }
        }
      }
    } else if (formState.splitMode === "EXACT") {
      // Ensure exact amount doesn't exceed total
      const maxAllowed = Math.min(parsedAmount, value);
      newShareValues[personId] = maxAllowed;
      
      // Auto-adjust other amounts if total exceeds the expense amount
      const currentTotal = Object.entries(newShareValues)
        .filter(([id]) => formState.selectedPersonIds.includes(id))
        .reduce((sum, [, val]) => sum + val, 0);
      
      if (currentTotal > parsedAmount) {
        const excess = currentTotal - parsedAmount;
        const otherPersonIds = formState.selectedPersonIds.filter(id => id !== personId);
        
        if (otherPersonIds.length > 0) {
          // Distribute the excess reduction proportionally among other people
          const otherTotal = otherPersonIds.reduce((sum, id) => sum + (newShareValues[id] || 0), 0);
          
          if (otherTotal > 0) {
            otherPersonIds.forEach(id => {
              const currentValue = newShareValues[id] || 0;
              const proportion = currentValue / otherTotal;
              const reduction = excess * proportion;
              newShareValues[id] = Math.max(0, currentValue - reduction);
            });
          }
        }
      }
    }
    
    updateFormState({ shareValues: newShareValues, formErrors: null });
  };

  // Auto-balance function for quick equal distribution
  const autoBalance = () => {
    const parsedAmount = parseFloat(formState.amount) || 0;
    const newShareValues: Record<string, number> = {};
    
    if (formState.splitMode === "PERCENT") {
      const evenPercent = 100 / formState.selectedPersonIds.length;
      formState.selectedPersonIds.forEach((id, index) => {
        // Give any remainder to the last person
        if (index === formState.selectedPersonIds.length - 1) {
          const totalAssigned = evenPercent * (formState.selectedPersonIds.length - 1);
          newShareValues[id] = 100 - totalAssigned;
        } else {
          newShareValues[id] = Math.floor(evenPercent * 100) / 100; // Round to 2 decimal places
        }
      });
    } else if (formState.splitMode === "EXACT") {
      const evenAmount = parsedAmount / formState.selectedPersonIds.length;
      formState.selectedPersonIds.forEach((id, index) => {
        // Give any remainder to the last person
        if (index === formState.selectedPersonIds.length - 1) {
          const totalAssigned = evenAmount * (formState.selectedPersonIds.length - 1);
          newShareValues[id] = parsedAmount - totalAssigned;
        } else {
          newShareValues[id] = Math.floor(evenAmount * 100) / 100; // Round to 2 decimal places
        }
      });
    }
    
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

  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate current totals for display
  const currentPercentTotal = formState.splitMode === "PERCENT" 
    ? Object.entries(formState.shareValues)
        .filter(([id]) => formState.selectedPersonIds.includes(id))
        .reduce((sum, [, val]) => sum + val, 0)
    : 0;

  const currentExactTotal = formState.splitMode === "EXACT"
    ? Object.entries(formState.shareValues)
        .filter(([id]) => formState.selectedPersonIds.includes(id))
        .reduce((sum, [, val]) => sum + val, 0)
    : 0;

  // Get step title for accessibility
  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Add Expense - Step 1: Expense Details";
      case 2: return "Add Expense - Step 2: Select People";
      case 3: return "Add Expense - Step 3: Split Configuration";
      default: return "Add Expense";
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
      
      <DialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-3xl h-[95vh] max-h-[700px] flex flex-col p-0 gap-0 bg-white dark:bg-gray-900 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{getStepTitle()}</DialogTitle>
        </DialogHeader>

        {/* Animated Header */}
        <motion.div 
          className="flex-shrink-0 relative overflow-hidden"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-purple-600/10 to-blue-600/10" />
          <div className="relative p-4 sm:p-6 border-b border-violet-100 dark:border-violet-800">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <motion.div
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                      ${currentStep >= step 
                        ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-lg' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                      }
                    `}
                    animate={{ scale: currentStep === step ? 1.1 : 1 }}
                  >
                    {currentStep > step ? (
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      step
                    )}
                  </motion.div>
                  {step < 3 && (
                    <div className={`
                      w-8 sm:w-12 h-0.5 mx-2 transition-all duration-300
                      ${currentStep > step 
                        ? 'bg-gradient-to-r from-violet-500 to-blue-500' 
                        : 'bg-gray-200 dark:bg-gray-700'
                      }
                    `} />
                  )}
                </div>
              ))}
            </div>

            {/* Step Title & Description */}
            <div className="text-center">
              <motion.h2 
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent mb-2"
              >
                {currentStep === 1 && "What did you spend on?"}
                {currentStep === 2 && "Who's splitting this?"}
                {currentStep === 3 && "How to split it?"}
              </motion.h2>
              <motion.p 
                key={`desc-${currentStep}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                {currentStep === 1 && "Enter the expense details"}
                {currentStep === 2 && `Select people from ${people.length} members`}
                {currentStep === 3 && `Split ₹${parsedAmount.toFixed(2)} among ${formState.selectedPersonIds.length} people`}
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-4 sm:p-6">
              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  {/* Step 1: Expense Details */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      {/* Description Input */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Receipt className="h-5 w-5 text-violet-500" />
                          Description
                        </Label>
                        <div className="relative">
                          <Input
                            value={formState.description}
                            onChange={(e) => updateFormState({ description: e.target.value })}
                            placeholder="Dinner at restaurant, groceries, movie tickets..."
                            className="h-14 text-base bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 focus:border-violet-400 dark:focus:border-violet-500 rounded-xl transition-all duration-200 pl-4"
                            autoFocus
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/5 to-blue-500/5 pointer-events-none" />
                        </div>
                      </div>

                      {/* Amount Input */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <IndianRupee className="h-5 w-5 text-violet-500" />
                          Total Amount
                        </Label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 text-gray-500">
                            <IndianRupee className="h-5 w-5" />
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formState.amount}
                            onChange={(e) => updateFormState({ amount: e.target.value })}
                            placeholder="0.00"
                            className="h-14 text-base pl-12 bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 focus:border-violet-400 dark:focus:border-violet-500 rounded-xl transition-all duration-200"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/5 to-blue-500/5 pointer-events-none" />
                        </div>
                      </div>

                      {/* Paid By Selection */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Users className="h-5 w-5 text-violet-500" />
                          Paid By
                        </Label>
                        <Select value={formState.paidById} onValueChange={(value) => updateFormState({ paidById: value })}>
                          <SelectTrigger className="h-14 w-full bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 focus:border-violet-400 dark:focus:border-violet-500 rounded-xl text-base">
                            <SelectValue placeholder="Who paid for this expense?" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {people.map((person) => (
                              <SelectItem key={person.id} value={person.id} className="py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-blue-400 flex items-center justify-center text-white text-sm font-semibold">
                                    {getPersonInitials(person.name)}
                                  </div>
                                  <span className="font-medium">{person.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: People Selection */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      {/* Search Bar */}
                      {people.length > 6 && (
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search people..."
                            className="pl-10 h-12 bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 focus:border-violet-400 rounded-xl"
                          />
                        </div>
                      )}

                      {/* Selection Summary */}
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 rounded-xl border border-violet-200 dark:border-violet-800">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-5 w-5 text-violet-600" />
                          <span className="font-medium text-violet-700 dark:text-violet-400">
                            {formState.selectedPersonIds.length} people selected
                          </span>
                        </div>
                        {formState.selectedPersonIds.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateFormState({ selectedPersonIds: [] })}
                            className="text-violet-600 hover:text-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                          >
                            Clear all
                          </Button>
                        )}
                      </div>

                      {/* People Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                        {filteredPeople.map((person) => {
                          const isSelected = formState.selectedPersonIds.includes(person.id);
                          
                          return (
                            <motion.div
                              key={person.id}
                              layout
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handlePersonToggle(person.id)}
                              className={`
                                relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-300 group
                                ${isSelected 
                                  ? 'border-violet-400 bg-gradient-to-br from-violet-50 to-blue-50 shadow-lg dark:from-violet-900/30 dark:to-blue-900/30 dark:border-violet-500' 
                                  : 'border-gray-200 bg-white/70 hover:border-violet-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/70 hover:dark:border-violet-600'
                                }
                              `}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`
                                  w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all duration-300 relative
                                  ${isSelected 
                                    ? 'bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg' 
                                    : 'bg-gray-400 dark:bg-gray-600 group-hover:bg-violet-400'
                                  }
                                `}>
                                  {getPersonInitials(person.name)}
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
                                    >
                                      <Check className="h-3 w-3 text-white" />
                                    </motion.div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium truncate transition-colors ${isSelected ? 'text-violet-700 dark:text-violet-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {person.name}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {filteredPeople.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No people found matching "{searchQuery}"</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Step 3: Split Configuration */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6 h-full flex flex-col"
                    >
                      {/* Split Mode Selection */}
                      <div className="space-y-4 flex-shrink-0">
                        <Label className="text-base font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Calculator className="h-5 w-5 text-violet-500" />
                          Split Method
                        </Label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {splitModeOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = formState.splitMode === option.value;
                            
                            return (
                              <motion.button
                                key={option.value}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSplitModeUpdate(option.value)}
                                className={`
                                  relative p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden
                                  ${isSelected
                                    ? 'border-violet-400 bg-gradient-to-br from-violet-50 to-blue-50 shadow-lg dark:from-violet-900/30 dark:to-blue-900/30 dark:border-violet-500'
                                    : 'border-gray-200 bg-white/70 hover:border-violet-300 dark:border-gray-700 dark:bg-gray-800/70'
                                  }
                                `}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`
                                    w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300
                                    ${isSelected 
                                      ? `bg-gradient-to-r ${option.color} text-white shadow-lg` 
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                    }
                                  `}>
                                    <Icon className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className={`font-semibold text-sm ${isSelected ? 'text-violet-700 dark:text-violet-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                      {option.label}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {option.description}
                                </p>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center"
                                  >
                                    <Check className="h-4 w-4 text-white" />
                                  </motion.div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Error Display */}
                      {formState.formErrors && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 flex-shrink-0"
                        >
                          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          <span className="text-sm font-medium">{formState.formErrors}</span>
                        </motion.div>
                      )}

                      <div className="flex-1 min-h-0">
                        {/* Split Preview/Configuration */}
                        {formState.splitMode === "EQUAL" ? (
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                            <div className="text-center">
                              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                                <Equal className="h-8 w-8 text-white" />
                              </div>
                              <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
                                Equal Split
                              </h3>
                              <p className="text-3xl font-bold text-green-600 mb-2">
                                ₹{(parsedAmount / formState.selectedPersonIds.length).toFixed(2)}
                              </p>
                              <p className="text-sm text-green-600/80">
                                per person ({formState.selectedPersonIds.length} people)
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4 h-full flex flex-col">
                            <div className="flex items-center justify-between flex-shrink-0">
                              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Adjust {formState.splitMode === "PERCENT" ? "percentages" : "amounts"}
                              </Label>
                              <div className="flex items-center gap-2">
                                <div className={`text-xs px-2 py-1 rounded-full ${
                                  (formState.splitMode === "PERCENT" && Math.abs(currentPercentTotal - 100) < 0.01) ||
                                  (formState.splitMode === "EXACT" && Math.abs(currentExactTotal - parsedAmount) < 0.01)
                                    ? 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
                                    : 'text-orange-700 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400'
                                }`}>
                                  {formState.splitMode === "PERCENT" 
                                    ? `${currentPercentTotal.toFixed(1)}% / 100%`
                                    : `₹${currentExactTotal.toFixed(2)} / ₹${parsedAmount.toFixed(2)}`
                                  }
                                </div>
                                {(formState.splitMode === "PERCENT" || formState.splitMode === "EXACT") && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={autoBalance}
                                    className="text-xs h-7 px-2 border-violet-200 hover:border-violet-300 text-violet-600 hover:text-violet-700"
                                  >
                                    Auto Balance
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-3 flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                              {formState.selectedPersonIds.map((personId) => {
                                const person = people.find(p => p.id === personId);
                                if (!person) return null;
                                
                                const currentValue = formState.shareValues[personId] || 0;
                                const maxValue = formState.splitMode === "PERCENT" ? 100 : parsedAmount;
                                
                                return (
                                  <div key={personId} className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-blue-400 flex items-center justify-center text-white text-sm font-bold">
                                        {getPersonInitials(person.name)}
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-700 dark:text-gray-300">{person.name}</p>
                                        <p className="text-sm text-gray-500">
                                          {formState.splitMode === "PERCENT" 
                                            ? `₹${(currentValue * parsedAmount / 100).toFixed(2)}`
                                            : `${(currentValue / parsedAmount * 100).toFixed(1)}%`
                                          }
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold text-violet-600">
                                          {formState.splitMode === "PERCENT" 
                                            ? `${currentValue.toFixed(1)}%`
                                            : `₹${currentValue.toFixed(2)}`
                                          }
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {formState.splitMode === "PERCENT" ? (
                                      <div className="space-y-2">
                                        <Slider
                                          value={[currentValue]}
                                          onValueChange={(values) => handleShareUpdate(personId, values[0] || 0)}
                                          max={maxValue}
                                          step={0.1}
                                          className="py-2"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500">
                                          <span>0%</span>
                                          <span>100%</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <div className="relative">
                                          <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                          <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max={maxValue}
                                            value={currentValue || ""}
                                            onChange={(e) => handleShareUpdate(personId, parseFloat(e.target.value) || 0)}
                                            className="pl-10 h-10"
                                            placeholder="0.00"
                                          />
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                          <span>₹0.00</span>
                                          <span>₹{parsedAmount.toFixed(2)}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <motion.div 
          className="flex-shrink-0 p-4 sm:p-6 border-t bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : setOpen(false)}
              className="h-12 px-6 border-2 hover:border-violet-300 transition-all duration-200"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {currentStep === 1 ? "Cancel" : "Back"}
            </Button>
            
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canGoNext()}
                className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 h-12 px-6 flex-1 max-w-xs transition-all duration-200 disabled:opacity-50"
              >
                <span>Continue</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={!formIsValid || createExpense.isPending}
                className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 h-12 px-6 flex-1 max-w-xs transition-all duration-200 disabled:opacity-50"
              >
                {createExpense.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    <span>Add Expense</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
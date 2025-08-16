"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  type Person,
  type FormState,
  createInitialFormState,
  validateSplitShares,
  prepareShares,
  isFormValid,
} from "~/app/_components/features/group-management/utils";
import { ExpenseDetails } from "~/app/_components/features/expense/ExpenseForm/ExpenseDetails";
import { SplitConfiguration } from "~/app/_components/features/expense/ExpenseForm/SplitConfiguration";
import { FormHeader } from "~/app/_components/features/expense/ExpenseForm/FormHeader";
import { FormFooter } from "~/app/_components/features/expense/ExpenseForm/FormFooter";

interface ExpenseFormProps {
  groupId: string;
  people: Person[];
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
      await utils.settlement.list.invalidate({ groupId });
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

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(1);
    } else {
      setOpen(false);
    }
  };

  const handleContinue = () => {
    if (currentStep < 2) {
      setCurrentStep(2);
    }
  };

  const formIsValid = isFormValid(
    formState.description,
    formState.amount,
    formState.paidById,
    formState.selectedPersonIds,
  );

  const canGoNext = () => {
    return currentStep === 1
      ? Boolean(
          formState.description.trim() &&
            formState.amount &&
            formState.paidById &&
            formState.selectedPersonIds.length > 0,
        )
      : formIsValid;
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
          <Button className="bg-blue-600 text-white hover:bg-blue-700">
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
        <FormHeader currentStep={currentStep} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 pb-8">
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ExpenseDetails
                      people={people}
                      description={formState.description}
                      amount={formState.amount}
                      paidById={formState.paidById}
                      selectedPersonIds={formState.selectedPersonIds}
                      splitMode={formState.splitMode}
                      updateFormState={updateFormState}
                    />
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SplitConfiguration
                      people={people}
                      amount={formState.amount}
                      splitMode={formState.splitMode}
                      selectedPersonIds={formState.selectedPersonIds}
                      shareValues={formState.shareValues}
                      formErrors={formState.formErrors}
                      updateFormState={updateFormState}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>

        {/* Footer */}
        <FormFooter
          currentStep={currentStep}
          canContinue={canGoNext()}
          formIsValid={formIsValid}
          isPending={createExpense.isPending}
          onBack={handleBack}
          onContinue={handleContinue}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

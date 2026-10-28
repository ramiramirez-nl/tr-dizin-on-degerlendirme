import { useState } from 'react';

export function useMultiStepForm(totalSteps: number) {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () =>
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  const prev = () =>
    setCurrentStep((s) => Math.max(s - 1, 0));
  const goTo = (step: number) =>
    setCurrentStep(Math.max(0, Math.min(step, totalSteps - 1)));

  return {
    currentStep,
    isFirst: currentStep === 0,
    isLast: currentStep === totalSteps - 1,
    next,
    prev,
    goTo,
  };
}

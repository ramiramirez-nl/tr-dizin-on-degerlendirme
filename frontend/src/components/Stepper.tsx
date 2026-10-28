interface StepperProps {
  steps: string[];
  currentStep: number;
  errorSteps?: number[];
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, currentStep, errorSteps = [], onStepClick }: StepperProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex flex-wrap gap-2">
        {steps.map((label, idx) => {
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;
          const hasError = errorSteps.includes(idx);
          const base =
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition';
          const cls = isActive
            ? 'bg-blue-600 text-white'
            : hasError
              ? 'bg-red-100 text-red-800 ring-1 ring-red-300 hover:bg-red-200'
              : isDone
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200';
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => onStepClick?.(idx)}
                aria-current={isActive ? 'step' : undefined}
                className={`${base} ${cls}`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/30 text-xs">
                  {hasError && !isActive ? '!' : idx + 1}
                </span>
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

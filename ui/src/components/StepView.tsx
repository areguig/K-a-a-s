import { KarateStep } from '../types/karate';

interface StepViewProps {
  step: KarateStep;
  onToggleError?: (stepId: string) => void;
  expandedErrors?: { [key: string]: boolean };
}

export const getStepStatus = (step: KarateStep): 'passed' | 'failed' | 'skipped' => {
  if (step.status === 'failed' || (step.status === 'skipped' && step.errorMessage)) {
    return 'failed';
  }
  return step.status;
};

export const StepView: React.FC<StepViewProps> = ({ step, onToggleError, expandedErrors }) => {
  const stepStatus = getStepStatus(step);
  
  return (
    <div className={`step p-2 border-l-4 ${
      stepStatus === 'passed' ? 'border-green-500 bg-green-50' : 
      stepStatus === 'failed' ? 'border-red-500 bg-red-50' : 
      'border-gray-500 bg-gray-50'
    } mb-2`}>
      <div className="flex items-center cursor-pointer">
        <span className={`status-icon mr-2 ${
          stepStatus === 'passed' ? 'text-green-500' : 
          stepStatus === 'failed' ? 'text-red-500' : 
          'text-gray-500'
        }`}>
          {stepStatus === 'passed' ? '✓' : stepStatus === 'failed' ? '✗' : '○'}
        </span>
        <span className="font-medium">{step.name}</span>
        {step.errorMessage && (
          <button
            onClick={() => onToggleError?.(step.name)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            {expandedErrors?.[step.name] ? '▼' : '▶'}
          </button>
        )}
      </div>
      {step.errorMessage && expandedErrors?.[step.name] && (
        <pre className="mt-2 p-2 bg-red-100 text-red-700 rounded overflow-x-auto text-sm">
          {step.errorMessage}
        </pre>
      )}
    </div>
  );
};

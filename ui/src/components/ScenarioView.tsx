import { KarateScenario } from '../types/karate';
import { StepView } from './StepView';

interface ScenarioViewProps {
  scenario: KarateScenario;
  expanded: boolean;
  onToggle: (scenarioId: string) => void;
  onToggleError: (stepId: string) => void;
  expandedErrors: { [key: string]: boolean };
}

export const ScenarioView: React.FC<ScenarioViewProps> = ({
  scenario,
  expanded,
  onToggle,
  onToggleError,
  expandedErrors,
}) => {
  return (
    <div className="scenario mb-4 border rounded-lg overflow-hidden">
      <div
        className={`scenario-header p-3 cursor-pointer flex items-center justify-between ${
          scenario.status === 'passed' ? 'bg-green-100' : 
          scenario.status === 'failed' ? 'bg-red-100' : 
          'bg-gray-100'
        }`}
        onClick={() => onToggle(scenario.name)}
      >
        <div className="flex items-center">
          <span className={`status-icon mr-2 ${
            scenario.status === 'passed' ? 'text-green-500' : 
            scenario.status === 'failed' ? 'text-red-500' : 
            'text-gray-500'
          }`}>
            {scenario.status === 'passed' ? '✓' : scenario.status === 'failed' ? '✗' : '○'}
          </span>
          <span className="font-medium">{scenario.name}</span>
        </div>
        <span className="transform transition-transform duration-200" style={{
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)'
        }}>
          ▶
        </span>
      </div>
      {expanded && (
        <div className="scenario-body p-3 bg-white">
          {scenario.steps.map((step, index) => (
            <StepView
              key={`${scenario.name}-step-${index}`}
              step={step}
              onToggleError={onToggleError}
              expandedErrors={expandedErrors}
            />
          ))}
        </div>
      )}
    </div>
  );
};

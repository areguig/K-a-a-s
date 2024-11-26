import { KarateResult } from '../types/karate';

interface ResultsSummaryProps {
  result: KarateResult;
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({ result }) => {
  return (
    <div className="summary bg-white rounded-lg shadow-sm p-4 mb-4">
      <h3 className="text-lg font-semibold">Test Results</h3>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-green-800 font-medium">Passed</div>
          <div className="text-2xl font-bold text-green-900">
            {result.scenarios.passed}
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-red-800 font-medium">Failed</div>
          <div className="text-2xl font-bold text-red-900">
            {result.scenarios.failed}
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-gray-800 font-medium">Total</div>
          <div className="text-2xl font-bold text-gray-900">
            {result.scenarios.total}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div>
          <div className="text-lg font-bold">
            {result.scenarios.passed}/{result.scenarios.total}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            Scenarios Passed
          </div>
        </div>
        <div>
          <div className="text-lg font-bold">
            {result.features.passed}/{result.features.total}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            Features Passed
          </div>
        </div>
        <div>
          <div className="text-lg font-bold">{result.time || 0}ms</div>
          <div className="text-sm text-gray-600 mt-2">
            Execution Time
          </div>
        </div>
      </div>
    </div>
  );
};

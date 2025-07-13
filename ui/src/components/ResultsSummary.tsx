import React from 'react';
import { KarateResult } from '../types/karate';
import { TestProgressBar } from './ProgressBar';
import { StatusIcon, TestStatusBadge } from './StatusIcon';
import { Clock, Target, CheckCircle } from 'lucide-react';

interface ResultsSummaryProps {
  result: KarateResult;
  isRunning?: boolean;
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({ 
  result, 
  isRunning = false 
}) => {
  // Format execution time with better readability
  const formatTime = (milliseconds: number): string => {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Calculate success rate
  const successRate = result.scenarios.total > 0 
    ? Math.round((result.scenarios.passed / result.scenarios.total) * 100)
    : 0;

  return (
    <div className="card-elevated p-6 space-y-6">
      {/* Header with overall status */}
      <div className="flex items-center justify-between">
        <h3 className="text-heading-3 text-gray-900">Test Execution Summary</h3>
        <TestStatusBadge
          passed={result.scenarios.passed}
          failed={result.scenarios.failed}
          total={result.scenarios.total}
          isRunning={isRunning}
          size="lg"
        />
      </div>

      {/* Main metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Passed Tests */}
        <div className="bg-green-50 p-6 rounded-2xl border border-green-200 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="text-green-700 font-semibold text-sm uppercase tracking-wide">
              Passed
            </div>
            <StatusIcon status="passed" size="lg" animated={isRunning} />
          </div>
          <div className="text-3xl font-bold text-green-800 mb-1">
            {result.scenarios.passed}
          </div>
          <div className="text-green-600 text-sm">
            {result.scenarios.total > 0 && (
              `${Math.round((result.scenarios.passed / result.scenarios.total) * 100)}% success rate`
            )}
          </div>
        </div>

        {/* Failed Tests */}
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="text-red-700 font-semibold text-sm uppercase tracking-wide">
              Failed
            </div>
            <StatusIcon 
              status="failed" 
              size="lg" 
              animated={result.scenarios.failed > 0 && isRunning} 
            />
          </div>
          <div className="text-3xl font-bold text-red-800 mb-1">
            {result.scenarios.failed}
          </div>
          <div className="text-red-600 text-sm">
            {result.scenarios.failed > 0 ? (
              `${Math.round((result.scenarios.failed / result.scenarios.total) * 100)}% failure rate`
            ) : (
              'No failures'
            )}
          </div>
        </div>

        {/* Total Tests */}
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="text-blue-700 font-semibold text-sm uppercase tracking-wide">
              Total
            </div>
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-800 mb-1">
            {result.scenarios.total}
          </div>
          <div className="text-blue-600 text-sm">
            Scenarios executed
          </div>
        </div>
      </div>

      {/* Progress visualization */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span>Execution Progress</span>
        </h4>
        
        <TestProgressBar
          passed={result.scenarios.passed}
          failed={result.scenarios.failed}
          total={result.scenarios.total}
          className="mb-4"
        />
      </div>

      {/* Detailed metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
        {/* Scenario Success Rate */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {successRate}%
          </div>
          <div className="text-sm text-gray-600">
            Success Rate
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {result.scenarios.passed}/{result.scenarios.total} scenarios
          </div>
        </div>

        {/* Feature Success */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {result.features.passed}/{result.features.total}
          </div>
          <div className="text-sm text-gray-600">
            Features Passed
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {result.features.total > 0 && (
              `${Math.round((result.features.passed / result.features.total) * 100)}% complete`
            )}
          </div>
        </div>

        {/* Execution Time */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <Clock className="w-5 h-5 text-gray-600" />
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(result.time || 0)}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Execution Time
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {result.scenarios.total > 0 && result.time && (
              `~${Math.round((result.time || 0) / result.scenarios.total)}ms per scenario`
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

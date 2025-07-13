import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  variant?: 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  variant = 'info',
  size = 'md',
  showLabel = true,
  animated = true,
  className = ''
}) => {
  const percentage = max <= 0 ? 0 : Math.min(Math.round((value / max) * 100), 100);

  const variantClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const backgroundVariantClasses = {
    success: 'bg-green-100',
    error: 'bg-red-100',
    warning: 'bg-yellow-100',
    info: 'bg-blue-100'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">
            {percentage}%
          </span>
          <span className="text-sm text-gray-500">
            {value}/{max}
          </span>
        </div>
      )}
      <div className={`
        w-full ${sizeClasses[size]} 
        ${backgroundVariantClasses[variant]} 
        rounded-full overflow-hidden
      `}>
        <div
          className={`
            ${sizeClasses[size]} 
            ${variantClasses[variant]} 
            rounded-full transition-all duration-700 ease-out
            ${animated ? 'animate-pulse' : ''}
          `}
          style={{
            width: `${percentage}%`,
            transition: animated ? 'width 0.7s ease-out' : 'none'
          }}
        />
      </div>
    </div>
  );
};

// Specialized progress bar for test results
interface TestProgressBarProps {
  passed: number;
  failed: number;
  total: number;
  showSegments?: boolean;
  className?: string;
}

export const TestProgressBar: React.FC<TestProgressBarProps> = ({
  passed,
  failed,
  total,
  showSegments = true,
  className = ''
}) => {
  const passedPercentage = Math.round((passed / Math.max(total, 1)) * 100);
  const failedPercentage = Math.round((failed / Math.max(total, 1)) * 100);
  const skippedPercentage = 100 - passedPercentage - failedPercentage;

  if (!showSegments) {
    return (
      <ProgressBar
        value={passed}
        max={total}
        variant="success"
        className={className}
      />
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-medium text-green-700">{passed} Passed</span>
          </div>
          {failed > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="font-medium text-red-700">{failed} Failed</span>
            </div>
          )}
          {skippedPercentage > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="font-medium text-gray-600">
                {Math.round((skippedPercentage / 100) * total)} Skipped
              </span>
            </div>
          )}
        </div>
        <span className="text-sm font-bold text-gray-900">
          {total} Total
        </span>
      </div>
      
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full flex">
          {/* Passed section */}
          {passedPercentage > 0 && (
            <div
              className="bg-green-500 h-full transition-all duration-700 ease-out"
              style={{ width: `${passedPercentage}%` }}
            />
          )}
          {/* Failed section */}
          {failedPercentage > 0 && (
            <div
              className="bg-red-500 h-full transition-all duration-700 ease-out"
              style={{ width: `${failedPercentage}%` }}
            />
          )}
          {/* Skipped section */}
          {skippedPercentage > 0 && (
            <div
              className="bg-gray-400 h-full transition-all duration-700 ease-out"
              style={{ width: `${skippedPercentage}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, Play, Pause } from 'lucide-react';

interface StatusIconProps {
  status: 'passed' | 'failed' | 'running' | 'pending' | 'warning' | 'skipped';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}

export const StatusIcon: React.FC<StatusIconProps> = ({
  status,
  size = 'md',
  animated = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'passed':
        return {
          icon: CheckCircle,
          className: 'text-green-600',
          animation: animated ? 'animate-bounce' : ''
        };
      case 'failed':
        return {
          icon: XCircle,
          className: 'text-red-600',
          animation: animated ? 'animate-pulse' : ''
        };
      case 'running':
        return {
          icon: Play,
          className: 'text-blue-600',
          animation: animated ? 'animate-spin' : ''
        };
      case 'pending':
        return {
          icon: Clock,
          className: 'text-yellow-600',
          animation: animated ? 'animate-pulse' : ''
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          className: 'text-orange-600',
          animation: animated ? 'animate-bounce' : ''
        };
      case 'skipped':
        return {
          icon: Pause,
          className: 'text-gray-500',
          animation: ''
        };
      default:
        return {
          icon: Clock,
          className: 'text-gray-400',
          animation: ''
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <IconComponent
      className={`
        ${sizeClasses[size]} 
        ${config.className} 
        ${config.animation} 
        ${className}
      `}
    />
  );
};

// Specialized status indicator with text
interface StatusIndicatorProps {
  status: 'passed' | 'failed' | 'running' | 'pending' | 'warning' | 'skipped';
  label?: string;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  animated?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  count,
  size = 'md',
  showCount = true,
  animated = true,
  className = ''
}) => {
  const getStatusLabel = () => {
    if (label) return label;
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusColors = () => {
    switch (status) {
      case 'passed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'running':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'pending':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'warning':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'skipped':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  return (
    <div className={`
      inline-flex items-center space-x-2 rounded-lg border 
      ${getStatusColors()} 
      ${sizeClasses[size]} 
      ${className}
    `}>
      <StatusIcon 
        status={status} 
        size={size === 'lg' ? 'md' : 'sm'} 
        animated={animated}
      />
      <span className="font-medium">{getStatusLabel()}</span>
      {showCount && count !== undefined && (
        <span className="font-bold">{count}</span>
      )}
    </div>
  );
};

// Overall test status indicator
interface TestStatusBadgeProps {
  passed: number;
  failed: number;
  total: number;
  isRunning?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TestStatusBadge: React.FC<TestStatusBadgeProps> = ({
  passed,
  failed,
  total,
  isRunning = false,
  size = 'md',
  className = ''
}) => {
  const getOverallStatus = (): StatusIndicatorProps['status'] => {
    if (isRunning) return 'running';
    if (failed > 0) return 'failed';
    if (passed === total && total > 0) return 'passed';
    if (passed > 0) return 'warning';
    return 'pending';
  };

  const getStatusMessage = () => {
    if (isRunning) return 'Running Tests...';
    if (failed > 0) return `${failed} Test${failed > 1 ? 's' : ''} Failed`;
    if (passed === total && total > 0) return 'All Tests Passed';
    if (passed > 0) return `${passed}/${total} Tests Passed`;
    return 'No Tests Run';
  };

  return (
    <StatusIndicator
      status={getOverallStatus()}
      label={getStatusMessage()}
      size={size}
      showCount={false}
      animated={isRunning}
      className={className}
    />
  );
};
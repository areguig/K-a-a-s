import React from 'react';
import { Clock, Play, Trash2, CheckCircle, XCircle, AlertCircle, Tag } from 'lucide-react';
import { ExecutionHistory } from '../types/history';

interface HistoryCardProps {
  execution: ExecutionHistory;
  onReExecute: (execution: ExecutionHistory) => void;
  onDelete: (id: string) => void;
  isCompact?: boolean;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
  execution,
  onReExecute,
  onDelete,
  isCompact = false
}) => {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      const minutes = Math.floor(diffMs / (1000 * 60));
      return `${minutes}m ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatExecutionTime = (time?: number) => {
    if (!time) return 'N/A';
    return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(1)}s`;
  };

  const getStatusIcon = () => {
    switch (execution.resultSummary.status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-status-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-status-error" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-status-warning" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadgeClass = () => {
    switch (execution.resultSummary.status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'error':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFeatureTitle = () => {
    const lines = execution.featureContent.split('\n');
    const featureLine = lines.find(line => line.trim().startsWith('Feature:'));
    if (featureLine) {
      return featureLine.replace('Feature:', '').trim();
    }
    return 'Untitled Feature';
  };

  const handleReExecute = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReExecute(execution);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(execution.id);
  };

  if (isCompact) {
    return (
      <div className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {getStatusIcon()}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {getFeatureTitle()}
            </p>
            <p className="text-xs text-gray-500">
              {formatTimestamp(execution.timestamp)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReExecute}
            className="p-1 text-gray-400 hover:text-brand-primary transition-colors"
            title="Re-execute"
          >
            <Play className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated hover:shadow-lg transition-all duration-200 cursor-pointer group">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {getStatusIcon()}
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {getFeatureTitle()}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReExecute}
              className="btn-icon-sm text-brand-primary hover:bg-brand-primary hover:text-white"
              title="Re-execute this test"
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="btn-icon-sm text-red-600 hover:bg-red-600 hover:text-white"
              title="Delete from history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status and metrics */}
        <div className="flex items-center justify-between mb-3">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass()}`}>
            {execution.resultSummary.status}
          </div>
          <div className="text-xs text-gray-500 flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{formatTimestamp(execution.timestamp)}</span>
          </div>
        </div>

        {/* Test results summary */}
        <div className="grid grid-cols-3 gap-4 mb-3 text-center">
          <div>
            <div className="text-lg font-bold text-status-success">
              {execution.resultSummary.passed}
            </div>
            <div className="text-xs text-gray-500">Passed</div>
          </div>
          <div>
            <div className="text-lg font-bold text-status-error">
              {execution.resultSummary.failed}
            </div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-600">
              {execution.resultSummary.total}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>

        {/* Execution time */}
        {execution.resultSummary.executionTime && (
          <div className="text-xs text-gray-500 text-center mb-3">
            Execution time: {formatExecutionTime(execution.resultSummary.executionTime)}
          </div>
        )}

        {/* Scenarios */}
        {execution.scenarioNames.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-700 mb-1">Scenarios:</div>
            <div className="space-y-1">
              {execution.scenarioNames.slice(0, 3).map((name, index) => (
                <div key={index} className="text-xs text-gray-600 truncate">
                  • {name}
                </div>
              ))}
              {execution.scenarioNames.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{execution.scenarioNames.length - 3} more...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {execution.tags.length > 0 && (
          <div className="flex items-center space-x-1 flex-wrap">
            <Tag className="w-3 h-3 text-gray-400" />
            {execution.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
              >
                @{tag}
              </span>
            ))}
            {execution.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{execution.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
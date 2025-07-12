import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight,
  BarChart3,
  Calendar,
  Tag
} from 'lucide-react';
import { HistoryCard } from './HistoryCard';
import { useExecutionHistory } from '../hooks/useExecutionHistory';
import { ExecutionHistory, HistorySearchFilters } from '../types/history';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadHistory: (execution: ExecutionHistory) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  onLoadHistory
}) => {
  const {
    isLoading,
    searchFilters,
    currentPage,
    paginatedData,
    allTags,
    statistics,
    updateFilters,
    setCurrentPage,
    deleteExecution,
    clearHistory,
    exportHistory,
    importHistory
  } = useExecutionHistory();

  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const handleSearch = (searchTerm: string) => {
    updateFilters({ searchTerm });
  };

  const handleStatusFilter = (status: 'all' | 'success' | 'failed' | 'error') => {
    updateFilters({ status });
  };

  const handleTagFilter = (tag: string) => {
    const currentTags = searchFilters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    updateFilters({ tags: newTags });
  };

  const handleDateFilter = (dateFrom?: Date, dateTo?: Date) => {
    updateFilters({ dateFrom, dateTo });
  };

  const handleExport = () => {
    const data = exportHistory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaas-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = importHistory(content);
      if (success) {
        alert('History imported successfully!');
      } else {
        alert('Failed to import history. Please check the file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all execution history? This action cannot be undone.')) {
      clearHistory();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="flex-1 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="w-96 bg-white shadow-xl flex flex-col max-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-surface-secondary">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-brand-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Execution History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchFilters.searchTerm || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm"
            />
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between space-x-2">
            <div className="flex space-x-1">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-icon-sm ${showFilters ? 'bg-brand-primary text-white' : 'text-gray-600'}`}
                title="Filters"
              >
                <Filter className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowStats(!showStats)}
                className={`btn-icon-sm ${showStats ? 'bg-brand-primary text-white' : 'text-gray-600'}`}
                title="Statistics"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex space-x-1">
              <button
                onClick={handleExport}
                className="btn-icon-sm text-gray-600"
                title="Export history"
              >
                <Download className="w-4 h-4" />
              </button>
              <label className="btn-icon-sm text-gray-600 cursor-pointer" title="Import history">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleClearHistory}
                className="btn-icon-sm text-red-600"
                title="Clear all history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
            {/* Status filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
              <div className="flex space-x-2">
                {(['all', 'success', 'failed', 'error'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusFilter(status)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      searchFilters.status === status
                        ? 'bg-brand-primary text-white'
                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags filter */}
            {allTags.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagFilter(tag)}
                      className={`inline-flex items-center px-2 py-1 text-xs rounded transition-colors ${
                        searchFilters.tags?.includes(tag)
                          ? 'bg-brand-primary text-white'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      @{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Statistics */}
        {showStats && (
          <div className="p-4 border-b border-gray-200 bg-blue-50">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-brand-primary">
                  {statistics.totalExecutions}
                </div>
                <div className="text-xs text-gray-600">Total Executions</div>
              </div>
              <div>
                <div className="text-lg font-bold text-status-success">
                  {statistics.successRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Success Rate</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-700">
                  {statistics.totalTests}
                </div>
                <div className="text-xs text-gray-600">Total Tests</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-700">
                  {statistics.averageExecutionTime > 0 
                    ? `${(statistics.averageExecutionTime / 1000).toFixed(1)}s` 
                    : 'N/A'}
                </div>
                <div className="text-xs text-gray-600">Avg. Time</div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">Loading history...</div>
            </div>
          ) : paginatedData.histories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <History className="w-8 h-8 mb-2 text-gray-300" />
              <div className="text-sm">No execution history found</div>
              {searchFilters.searchTerm && (
                <button
                  onClick={() => updateFilters({ searchTerm: '' })}
                  className="text-xs text-brand-primary hover:underline mt-1"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {paginatedData.histories.map(execution => (
                <HistoryCard
                  key={execution.id}
                  execution={execution}
                  onReExecute={onLoadHistory}
                  onDelete={deleteExecution}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {paginatedData.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 bg-surface-secondary">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {paginatedData.totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!paginatedData.hasPrevPage}
                  className="btn-icon-sm text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!paginatedData.hasNextPage}
                  className="btn-icon-sm text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
import { useState, useEffect, useRef } from 'react';
import { Activity, Zap, CheckCircle, AlertCircle, Clock, History, Download, FolderOpen, Menu } from 'lucide-react';
import { KarateVersions } from '../types/karate';

interface HeaderProps {
  versions?: KarateVersions;
  isRunning?: boolean;
  lastExecutionTime?: number;
  onRunTests: () => void;
  onShowHistory?: () => void;
  activeFileName?: string;
  onDownloadFile?: () => void;
  onDownloadWorkspace?: () => void;
  onToggleFileExplorer?: () => void;
  onSaveWorkspace?: () => void;
  hasUnsavedChanges?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  versions,
  isRunning = false,
  lastExecutionTime,
  onRunTests,
  onShowHistory,
  activeFileName,
  onDownloadFile,
  onDownloadWorkspace,
  onToggleFileExplorer,
  onSaveWorkspace,
  hasUnsavedChanges = false,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate API connection check based on versions availability
    if (versions?.karate && versions?.java) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [versions]);

  // Handle click outside to close download menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };

    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDownloadMenu]);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <Activity className="w-4 h-4 text-yellow-500 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'API Connected';
      case 'disconnected':
        return 'API Disconnected';
      case 'checking':
        return 'Checking Connection...';
    }
  };

  const formatExecutionTime = (time?: number) => {
    if (!time) return '';
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  return (
    <header className="bg-gradient-to-r from-brand-primary via-blue-700 to-brand-secondary shadow-strong">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-heading-2 text-white">
                KaaS
              </h1>
              <p className="text-blue-100 text-body-sm font-medium">
                {activeFileName ? `Editing: ${activeFileName}` : 'Karate as a Service'}
              </p>
            </div>
          </div>

          {/* Status Information */}
          <div className="flex items-center space-x-6">
            {/* API Status */}
            <div className="flex items-center space-x-2 text-white">
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>

            {/* Version Info */}
            {versions?.karate && (
              <div className="text-white text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-blue-200">Karate:</span>
                  <span className="font-mono font-medium">{versions.karate}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-blue-200">Java:</span>
                  <span className="font-mono font-medium">{versions.java}</span>
                </div>
              </div>
            )}

            {/* Last Execution Time */}
            {lastExecutionTime && (
              <div className="flex items-center space-x-2 text-white">
                <Clock className="w-4 h-4 text-blue-200" />
                <span className="text-sm">
                  Last run: <span className="font-mono">{formatExecutionTime(lastExecutionTime)}</span>
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* File Explorer Toggle */}
              {onToggleFileExplorer && (
                <button
                  onClick={onToggleFileExplorer}
                  className="p-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200 hover:shadow-medium transform hover:-translate-y-0.5"
                  title="Toggle file explorer"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              {/* Save Button */}
              {onSaveWorkspace && (
                <button
                  onClick={onSaveWorkspace}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    hasUnsavedChanges
                      ? 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-medium transform hover:-translate-y-0.5'
                      : 'bg-white/10 text-white/70 cursor-default'
                  }`}
                  title={hasUnsavedChanges ? "Save workspace" : "No changes to save"}
                  disabled={!hasUnsavedChanges}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Save</span>
                    {hasUnsavedChanges && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </button>
              )}

              {/* Download Menu */}
              <div className="relative" ref={downloadMenuRef}>
                <button
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className="p-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200 hover:shadow-medium transform hover:-translate-y-0.5"
                  title="Download options"
                >
                  <Download className="w-5 h-5" />
                </button>
                {showDownloadMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {onDownloadFile && activeFileName && (
                      <button
                        onClick={() => {
                          onDownloadFile();
                          setShowDownloadMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Current File</span>
                      </button>
                    )}
                    {onDownloadWorkspace && (
                      <button
                        onClick={() => {
                          onDownloadWorkspace();
                          setShowDownloadMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span>Download Workspace</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* History Button */}
              {onShowHistory && (
                <button
                  onClick={onShowHistory}
                  className="p-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200 hover:shadow-medium transform hover:-translate-y-0.5"
                  title="View execution history"
                >
                  <History className="w-5 h-5" />
                </button>
              )}

              {/* Run Tests Button */}
              <button
                onClick={onRunTests}
                disabled={isRunning || connectionStatus === 'disconnected'}
                className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                  isRunning
                    ? 'bg-status-warning text-yellow-900 cursor-not-allowed'
                    : connectionStatus === 'disconnected'
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-surface-primary text-brand-primary hover:bg-blue-50 hover:shadow-medium transform hover:-translate-y-0.5'
                }`}
              >
                {isRunning ? (
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Running Tests...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Run Tests</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
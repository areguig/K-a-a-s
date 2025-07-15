import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, History, Activity, Zap, BookOpen, Code, GitBranch } from 'lucide-react';
import { KarateVersions } from '../types/karate';
import config from '../app/config';

interface HeaderProps {
  versions?: KarateVersions | null;
  lastExecutionTime?: number;
  onShowHistory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  versions,
  lastExecutionTime,
  onShowHistory,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    // Simulate API connection check based on versions availability
    if (versions?.version?.karateVersion && versions?.version?.javaVersion) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [versions]);

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
                Karate as a Service
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

            {/* System Info */}
            {versions?.version?.karateVersion && (
              <div className="text-white text-sm space-y-1">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-200">Karate:</span>
                    <span className="font-mono font-medium">{versions.version.karateVersion}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-200">Java:</span>
                    <span className="font-mono font-medium">{versions.version.javaVersion}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <GitBranch className="w-3 h-3 text-blue-300" />
                    <span className="text-blue-200">{versions.version.gitBranch}</span>
                  </div>
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
              {/* Documentation Links */}
              <div className="flex items-center space-x-2">
                <a
                  href="https://karatelabs.github.io/karate/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200 hover:shadow-medium transform hover:-translate-y-0.5"
                  title="Karate Documentation"
                >
                  <BookOpen className="w-5 h-5" />
                </a>
                <a
                  href={`${config.apiUrl}/swagger-ui/index.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200 hover:shadow-medium transform hover:-translate-y-0.5"
                  title="API Documentation"
                >
                  <Code className="w-5 h-5" />
                </a>
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
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
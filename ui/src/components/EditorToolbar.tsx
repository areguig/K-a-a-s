'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Save, Download, FolderOpen, History, Wand2 } from 'lucide-react';

interface EditorToolbarProps {
  activeFileName?: string;
  hasUnsavedChanges?: boolean;
  isRunning?: boolean;
  isApiConnected?: boolean;
  onRunTests: () => void;
  onSaveWorkspace?: () => void;
  onDownloadFile?: () => void;
  onDownloadWorkspace?: () => void;
  onShowHistory?: () => void;
  onGenerateFeature?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  activeFileName,
  hasUnsavedChanges = false,
  isRunning = false,
  isApiConnected = true,
  onRunTests,
  onSaveWorkspace,
  onDownloadFile,
  onDownloadWorkspace,
  onShowHistory,
  onGenerateFeature
}) => {
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
      {/* Left Side - File Actions */}
      <div className="flex items-center space-x-2">
        {/* Save Button */}
        {onSaveWorkspace && (
          <button
            onClick={onSaveWorkspace}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
              hasUnsavedChanges
                ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-default'
            }`}
            title={hasUnsavedChanges ? "Save workspace" : "No changes to save"}
            disabled={!hasUnsavedChanges}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
            {hasUnsavedChanges && (
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            )}
          </button>
        )}

        {/* Download Menu */}
        <div className="relative" ref={downloadMenuRef}>
          <button
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-200 flex items-center space-x-1.5"
            title="Download options"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
          {showDownloadMenu && (
            <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
              {onDownloadFile && activeFileName && (
                <button
                  onClick={() => {
                    onDownloadFile();
                    setShowDownloadMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
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
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
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
            className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-200 flex items-center space-x-1.5"
            title="View execution history"
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        )}

        {/* Generate Feature Button */}
        {onGenerateFeature && (
          <button
            onClick={onGenerateFeature}
            className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all duration-200 flex items-center space-x-1.5 shadow-sm"
            title="Generate feature using AI"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Generate</span>
          </button>
        )}
      </div>

      {/* Right Side - Run Tests */}
      <div className="flex items-center">
        <button
          onClick={onRunTests}
          disabled={isRunning || !isApiConnected}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
            isRunning
              ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
              : !isApiConnected
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
          }`}
          title={
            !isApiConnected 
              ? "API not connected" 
              : isRunning 
              ? "Tests are running..." 
              : "Run tests for current file"
          }
        >
          <Play className={`w-4 h-4 ${isRunning ? 'animate-pulse' : ''}`} />
          <span>{isRunning ? 'Running...' : 'Run Tests'}</span>
        </button>
      </div>
    </div>
  );
};
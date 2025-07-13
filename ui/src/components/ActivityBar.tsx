'use client';

import React from 'react';
import { Files, FolderOpen } from 'lucide-react';

interface ActivityBarProps {
  showFileExplorer: boolean;
  onToggleFileExplorer: () => void;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  showFileExplorer,
  onToggleFileExplorer
}) => {
  return (
    <div className="w-12 bg-gray-800 flex flex-col items-center py-2 border-r border-gray-700">
      {/* File Explorer Toggle */}
      <button
        onClick={onToggleFileExplorer}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
          showFileExplorer
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-300 hover:text-white hover:bg-gray-700'
        }`}
        title="Toggle File Explorer"
      >
        {showFileExplorer ? (
          <FolderOpen className="w-5 h-5" />
        ) : (
          <Files className="w-5 h-5" />
        )}
      </button>
      
      {/* Future: Add more activity buttons here */}
      {/* Search, Git, Extensions, etc. */}
    </div>
  );
};
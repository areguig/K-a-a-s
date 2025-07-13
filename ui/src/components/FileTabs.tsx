'use client';

import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';

interface FileTabsProps {
  className?: string;
}

export const FileTabs: React.FC<FileTabsProps> = ({ className = '' }) => {
  const {
    workspace,
    setActiveFile,
    deleteFile,
    createFile,
    getActiveFile
  } = useWorkspace();

  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [dragOverTab, setDragOverTab] = useState<string | null>(null);

  const activeFile = getActiveFile();

  if (!workspace || workspace.files.length === 0) {
    return null;
  }

  const handleTabClick = (fileId: string) => {
    setActiveFile(fileId);
  };

  const handleTabClose = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    
    if (workspace.files.length > 1) {
      deleteFile(fileId);
    }
  };

  const handleNewTab = () => {
    try {
      const newFile = createFile('untitled');
      setActiveFile(newFile.id);
    } catch (error) {
      console.error('Failed to create new file:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    setDraggedTab(fileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, fileId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTab(fileId);
  };

  const handleDragLeave = () => {
    setDragOverTab(null);
  };

  const handleDrop = (e: React.DragEvent, targetFileId: string) => {
    e.preventDefault();
    
    if (draggedTab && draggedTab !== targetFileId) {
      // Reorder files by moving dragged file to target position
      const draggedIndex = workspace.files.findIndex(f => f.id === draggedTab);
      const targetIndex = workspace.files.findIndex(f => f.id === targetFileId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newFiles = [...workspace.files];
        const [draggedFile] = newFiles.splice(draggedIndex, 1);
        newFiles.splice(targetIndex, 0, draggedFile);
        
        // Note: This would require updating the workspace service to support file reordering
        // For now, we'll just log the intention
        console.log('File reordering would happen here:', draggedTab, 'to position of', targetFileId);
      }
    }
    
    setDraggedTab(null);
    setDragOverTab(null);
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
    setDragOverTab(null);
  };

  return (
    <div className={`flex items-center bg-gray-100 border-b border-gray-200 overflow-x-auto ${className}`}>
      {/* File Tabs */}
      <div className="flex items-center min-w-0 flex-1">
        {workspace.files.map((file, index) => (
          <div
            key={`tab-${file.id}`}
            className={`group relative flex items-center px-3 py-2 text-sm border-r border-gray-200 cursor-pointer transition-colors min-w-0 ${
              activeFile?.id === file.id
                ? 'bg-white text-gray-900 border-b-2 border-blue-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${
              dragOverTab === file.id ? 'bg-blue-50' : ''
            }`}
            onClick={() => handleTabClick(file.id)}
            draggable
            onDragStart={(e) => handleDragStart(e, file.id)}
            onDragOver={(e) => handleDragOver(e, file.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, file.id)}
            onDragEnd={handleDragEnd}
            title={file.name}
          >
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            
            <span className="truncate max-w-32">{file.name}</span>
            
            {file.isUnsaved && (
              <div className="w-2 h-2 bg-orange-400 rounded-full ml-2 flex-shrink-0" title="Unsaved changes" />
            )}
            
            {workspace.files.length > 1 && (
              <button
                onClick={(e) => handleTabClose(e, file.id)}
                className="ml-2 p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                title="Close file"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* New Tab Button */}
      <button
        onClick={handleNewTab}
        className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
        title="New file"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};
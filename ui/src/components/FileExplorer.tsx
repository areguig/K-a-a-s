'use client';

import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { WorkspaceFile } from '../types/workspace';

interface FileExplorerProps {
  className?: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ className = '' }) => {
  const {
    workspace,
    createFile,
    deleteFile,
    duplicateFile,
    renameFile,
    setActiveFile,
    getActiveFile
  } = useWorkspace();

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    fileId: string;
    x: number;
    y: number;
  } | null>(null);

  const activeFile = getActiveFile();

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      try {
        const newFile = createFile(newFileName.trim());
        setActiveFile(newFile.id);
        setNewFileName('');
        setIsCreatingFile(false);
      } catch (error) {
        console.error('Failed to create file:', error);
      }
    }
  };

  const handleRenameFile = (fileId: string) => {
    if (renameValue.trim()) {
      try {
        renameFile(fileId, renameValue.trim());
        setRenamingFileId(null);
        setRenameValue('');
      } catch (error) {
        console.error('Failed to rename file:', error);
        alert(error instanceof Error ? error.message : 'Failed to rename file');
      }
    }
  };

  const handleDuplicateFile = (fileId: string) => {
    try {
      const duplicate = duplicateFile(fileId);
      setActiveFile(duplicate.id);
    } catch (error) {
      console.error('Failed to duplicate file:', error);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    if (workspace && workspace.files.length > 1) {
      if (confirm('Are you sure you want to delete this file?')) {
        deleteFile(fileId);
      }
    } else {
      alert('Cannot delete the last file in the workspace');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    setContextMenu({ fileId, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const startRename = (fileId: string, currentName: string) => {
    setRenamingFileId(fileId);
    setRenameValue(currentName.replace('.feature', ''));
    closeContextMenu();
  };

  if (!workspace) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-gray-500">Loading workspace...</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gray-50 border-r border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Files</h3>
          <button
            onClick={() => setIsCreatingFile(true)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="New file"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        {/* New File Input */}
        {isCreatingFile && (
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFile();
                } else if (e.key === 'Escape') {
                  setIsCreatingFile(false);
                  setNewFileName('');
                }
              }}
              onBlur={() => {
                if (!newFileName.trim()) {
                  setIsCreatingFile(false);
                }
              }}
              placeholder="Enter file name..."
              className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
        )}

        {/* Files */}
        {workspace.files.map((file) => {
          if (renamingFileId === file.id) {
            return (
              <div key={`rename-${file.id}`} className="p-2">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRenameFile(file.id);
                    } else if (e.key === 'Escape') {
                      setRenamingFileId(null);
                      setRenameValue('');
                    }
                  }}
                  onBlur={() => handleRenameFile(file.id)}
                  className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            );
          }

          return (
            <div
              key={`explorer-${file.id}`}
              className={`flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                activeFile?.id === file.id ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' : 'text-gray-700'
              }`}
              onClick={() => setActiveFile(file.id)}
              onContextMenu={(e) => handleContextMenu(e, file.id)}
            >
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="flex-1 truncate">{file.name}</span>
              {file.isUnsaved && (
                <div className="w-2 h-2 bg-orange-400 rounded-full ml-1 flex-shrink-0" title="Unsaved changes" />
              )}
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
          />
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-32"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                const file = workspace.files.find(f => f.id === contextMenu.fileId);
                if (file) {
                  startRename(contextMenu.fileId, file.name);
                }
              }}
              className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100"
            >
              Rename
            </button>
            <button
              onClick={() => {
                handleDuplicateFile(contextMenu.fileId);
                closeContextMenu();
              }}
              className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100"
            >
              Duplicate
            </button>
            <button
              onClick={() => {
                handleDeleteFile(contextMenu.fileId);
                closeContextMenu();
              }}
              className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100 text-red-600"
              disabled={workspace.files.length <= 1}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};
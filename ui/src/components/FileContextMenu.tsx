'use client';

import React, { useEffect, useRef } from 'react';
import { WorkspaceFile } from '../types/workspace';

interface FileContextMenuProps {
  file: WorkspaceFile;
  x: number;
  y: number;
  onClose: () => void;
  onRename: (file: WorkspaceFile) => void;
  onDuplicate: (file: WorkspaceFile) => void;
  onDelete: (file: WorkspaceFile) => void;
  onDownload?: (file: WorkspaceFile) => void;
  canDelete?: boolean;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  file,
  x,
  y,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
  onDownload,
  canDelete = true
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position if menu would go off-screen
  const adjustedStyle = React.useMemo(() => {
    const menuWidth = 200;
    const menuHeight = 160;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth > viewportWidth) {
      adjustedX = x - menuWidth;
    }

    if (y + menuHeight > viewportHeight) {
      adjustedY = y - menuHeight;
    }

    return {
      left: Math.max(0, adjustedX),
      top: Math.max(0, adjustedY)
    };
  }, [x, y]);

  interface MenuItem {
    label: string;
    icon: React.ReactElement;
    onClick: () => void;
    className?: string;
  }

  const menuItems: MenuItem[] = [
    {
      label: 'Rename',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      onClick: () => {
        onRename(file);
        onClose();
      }
    },
    {
      label: 'Duplicate',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      onClick: () => {
        onDuplicate(file);
        onClose();
      }
    }
  ];

  if (onDownload) {
    menuItems.push({
      label: 'Download',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: () => {
        onDownload(file);
        onClose();
      }
    });
  }

  if (canDelete) {
    menuItems.push({
      label: 'Delete',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: () => {
        onDelete(file);
        onClose();
      },
      className: 'text-red-600 hover:bg-red-50'
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" />
      
      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-48"
        style={adjustedStyle}
      >
        {/* File Info Header */}
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate font-medium text-gray-900">{file.name}</span>
            {file.isUnsaved && (
              <div className="w-2 h-2 bg-orange-400 rounded-full ml-2" title="Unsaved changes" />
            )}
          </div>
        </div>

        {/* Menu Items */}
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={`w-full flex items-center px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
              item.className || 'text-gray-700'
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
};
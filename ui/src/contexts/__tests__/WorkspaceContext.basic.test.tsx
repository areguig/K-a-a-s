import React from 'react';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WorkspaceProvider, useWorkspace } from '../WorkspaceContext';
import workspaceService from '../../services/workspaceService';

// Mock workspace service
jest.mock('../../services/workspaceService');
const mockWorkspaceService = workspaceService as jest.Mocked<typeof workspaceService>;

describe('WorkspaceContext - Basic Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    const defaultWorkspace = {
      id: 'ws-1',
      name: 'Test Workspace',
      files: [{
        id: 'file-1',
        name: 'test.feature',
        featureContent: 'Feature: Test',
        configContent: '{}',
        lastModified: new Date(),
        isUnsaved: false
      }],
      activeFileId: 'file-1',
      lastModified: new Date(),
      settings: {
        autoSave: true,
        autoSaveInterval: 30000,
        showFileExplorer: true,
        theme: 'light' as const,
        defaultConfig: '{}'
      },
      version: '1.0.0'
    };
    
    mockWorkspaceService.loadWorkspace.mockResolvedValue(null);
    mockWorkspaceService.createWorkspace.mockReturnValue(defaultWorkspace);
    mockWorkspaceService.saveWorkspace.mockResolvedValue();
    mockWorkspaceService.hasUnsavedChanges.mockReturnValue(false);
    mockWorkspaceService.getActiveFile.mockReturnValue(defaultWorkspace.files[0]);
    mockWorkspaceService.updateFileContent.mockImplementation((workspace, fileId, featureContent, configContent) => {
      const file = workspace.files.find(f => f.id === fileId);
      if (file && featureContent !== undefined) {
        file.featureContent = featureContent;
        file.isUnsaved = true;
        return true;
      }
      return false;
    });
  });

  it('should provide workspace context', async () => {
    const { result } = renderHook(() => useWorkspace(), {
      wrapper: WorkspaceProvider
    });

    // Initial state should have loading true
    expect(result.current.isLoading).toBe(true);
    expect(result.current.workspace).toBeNull();
    expect(result.current.error).toBeNull();

    // Wait for initialization to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // After initialization
    expect(result.current.isLoading).toBe(false);
    expect(result.current.workspace).toBeDefined();
    expect(result.current.workspace?.name).toBe('Test Workspace');
  });

  it('should provide all required actions', async () => {
    const { result } = renderHook(() => useWorkspace(), {
      wrapper: WorkspaceProvider
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Check that all required actions are available
    expect(typeof result.current.createWorkspace).toBe('function');
    expect(typeof result.current.loadWorkspace).toBe('function');
    expect(typeof result.current.saveWorkspace).toBe('function');
    expect(typeof result.current.renameWorkspace).toBe('function');
    expect(typeof result.current.createFile).toBe('function');
    expect(typeof result.current.deleteFile).toBe('function');
    expect(typeof result.current.duplicateFile).toBe('function');
    expect(typeof result.current.renameFile).toBe('function');
    expect(typeof result.current.setActiveFile).toBe('function');
    expect(typeof result.current.updateFileContent).toBe('function');
    expect(typeof result.current.getActiveFile).toBe('function');
    expect(typeof result.current.updateSettings).toBe('function');
    expect(typeof result.current.enableAutoSave).toBe('function');
    expect(typeof result.current.disableAutoSave).toBe('function');
    expect(typeof result.current.importWorkspace).toBe('function');
    expect(typeof result.current.exportWorkspace).toBe('function');
  });

  it('should handle basic workspace operations', async () => {
    const { result } = renderHook(() => useWorkspace(), {
      wrapper: WorkspaceProvider
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Test rename workspace
    act(() => {
      result.current.renameWorkspace('New Name');
    });

    expect(result.current.workspace?.name).toBe('New Name');

    // Test set active file
    act(() => {
      result.current.setActiveFile('file-2');
    });

    expect(result.current.workspace?.activeFileId).toBe('file-2');
  });

  it('should handle file content updates', async () => {
    const { result } = renderHook(() => useWorkspace(), {
      wrapper: WorkspaceProvider
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Test update file content
    act(() => {
      result.current.updateFileContent('file-1', 'New feature content');
    });

    const updatedFile = result.current.workspace?.files.find(f => f.id === 'file-1');
    expect(updatedFile?.featureContent).toBe('New feature content');
    expect(updatedFile?.isUnsaved).toBe(true);
  });

  it('should throw error when used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useWorkspace());
    }).toThrow('useWorkspace must be used within a WorkspaceProvider');

    spy.mockRestore();
  });
});
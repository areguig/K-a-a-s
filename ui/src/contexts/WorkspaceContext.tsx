'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  Workspace,
  WorkspaceFile,
  WorkspaceState,
  WorkspaceActions,
  WorkspaceSettings,
  DEFAULT_WORKSPACE_SETTINGS
} from '../types/workspace';
import workspaceService from '../services/workspaceService';

// Action types for the reducer
type WorkspaceAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_WORKSPACE'; payload: Workspace | null }
  | { type: 'UPDATE_WORKSPACE'; payload: Partial<Workspace> }
  | { type: 'SET_ACTIVE_FILE'; payload: string }
  | { type: 'ADD_FILE'; payload: WorkspaceFile }
  | { type: 'UPDATE_FILE'; payload: { fileId: string; updates: Partial<WorkspaceFile> } }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<WorkspaceSettings> }
  | { type: 'MARK_FILE_SAVED'; payload: string }
  | { type: 'MARK_FILE_UNSAVED'; payload: string };

// Initial state
const initialState: WorkspaceState = {
  workspace: null,
  isLoading: false,
  error: null,
  hasUnsavedChanges: false
};

// Reducer function
function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_WORKSPACE':
      return {
        ...state,
        workspace: action.payload,
        error: null,
        isLoading: false,
        hasUnsavedChanges: action.payload ? workspaceService.hasUnsavedChanges(action.payload) : false
      };
    
    case 'UPDATE_WORKSPACE':
      if (!state.workspace) return state;
      const updatedWorkspace = { ...state.workspace, ...action.payload };
      return {
        ...state,
        workspace: updatedWorkspace,
        hasUnsavedChanges: workspaceService.hasUnsavedChanges(updatedWorkspace)
      };
    
    case 'SET_ACTIVE_FILE':
      if (!state.workspace) return state;
      return {
        ...state,
        workspace: { ...state.workspace, activeFileId: action.payload }
      };
    
    case 'ADD_FILE':
      if (!state.workspace) return state;
      const newWorkspace = {
        ...state.workspace,
        files: [...state.workspace.files, action.payload],
        lastModified: new Date()
      };
      return {
        ...state,
        workspace: newWorkspace,
        hasUnsavedChanges: workspaceService.hasUnsavedChanges(newWorkspace)
      };
    
    case 'UPDATE_FILE':
      if (!state.workspace) return state;
      const fileUpdatedWorkspace = {
        ...state.workspace,
        files: state.workspace.files.map(file =>
          file.id === action.payload.fileId
            ? { ...file, ...action.payload.updates, lastModified: new Date() }
            : file
        ),
        lastModified: new Date()
      };
      return {
        ...state,
        workspace: fileUpdatedWorkspace,
        hasUnsavedChanges: workspaceService.hasUnsavedChanges(fileUpdatedWorkspace)
      };
    
    case 'REMOVE_FILE':
      if (!state.workspace) return state;
      const filteredFiles = state.workspace.files.filter(f => f.id !== action.payload);
      let newActiveFileId = state.workspace.activeFileId;
      
      // If we removed the active file, set new active file
      if (state.workspace.activeFileId === action.payload) {
        newActiveFileId = filteredFiles.length > 0 ? filteredFiles[0].id : null;
      }
      
      const fileRemovedWorkspace = {
        ...state.workspace,
        files: filteredFiles,
        activeFileId: newActiveFileId,
        lastModified: new Date()
      };
      
      return {
        ...state,
        workspace: fileRemovedWorkspace,
        hasUnsavedChanges: workspaceService.hasUnsavedChanges(fileRemovedWorkspace)
      };
    
    case 'UPDATE_SETTINGS':
      if (!state.workspace) return state;
      const settingsUpdatedWorkspace = {
        ...state.workspace,
        settings: { ...state.workspace.settings, ...action.payload },
        lastModified: new Date()
      };
      return {
        ...state,
        workspace: settingsUpdatedWorkspace
      };
    
    case 'MARK_FILE_SAVED':
      if (!state.workspace) return state;
      const savedWorkspace = {
        ...state.workspace,
        files: state.workspace.files.map(file =>
          file.id === action.payload ? { ...file, isUnsaved: false } : file
        )
      };
      return {
        ...state,
        workspace: savedWorkspace,
        hasUnsavedChanges: workspaceService.hasUnsavedChanges(savedWorkspace)
      };
    
    case 'MARK_FILE_UNSAVED':
      if (!state.workspace) return state;
      const unsavedWorkspace = {
        ...state.workspace,
        files: state.workspace.files.map(file =>
          file.id === action.payload ? { ...file, isUnsaved: true } : file
        )
      };
      return {
        ...state,
        workspace: unsavedWorkspace,
        hasUnsavedChanges: true
      };
    
    default:
      return state;
  }
}

// Context type combining state and actions
type WorkspaceContextType = WorkspaceState & WorkspaceActions;

// Create context
const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// Provider component
interface WorkspaceProviderProps {
  children: React.ReactNode;
  autoSave?: boolean;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ 
  children, 
  autoSave = true 
}) => {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !state.workspace || !state.hasUnsavedChanges) {
      return;
    }

    const autoSaveInterval = state.workspace.settings.autoSave 
      ? state.workspace.settings.autoSaveInterval 
      : 30000;

    const timer = setTimeout(async () => {
      try {
        if (!state.workspace) return;
        
        await workspaceService.saveWorkspace(state.workspace);
        console.log('Auto-saved workspace');
        // Mark all files as saved after successful save
        state.workspace.files.forEach(file => {
          if (file.isUnsaved) {
            workspaceService.markFileSaved(state.workspace!, file.id);
          }
        });
        dispatch({ type: 'SET_WORKSPACE', payload: state.workspace });
      } catch (error) {
        console.error('Auto-save failed:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to auto-save workspace' });
      }
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [state.workspace, state.hasUnsavedChanges, autoSave]);

  // Initialize workspace on mount
  useEffect(() => {
    const initializeWorkspace = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const workspace = await workspaceService.loadWorkspace();
        if (workspace) {
          dispatch({ type: 'SET_WORKSPACE', payload: workspace });
        } else {
          // Create default workspace if none exists
          const defaultWorkspace = workspaceService.createWorkspace('My Workspace');
          await workspaceService.saveWorkspace(defaultWorkspace);
          dispatch({ type: 'SET_WORKSPACE', payload: defaultWorkspace });
        }
      } catch (error) {
        console.error('Failed to initialize workspace:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load workspace' });
        
        // Create fallback workspace
        const fallbackWorkspace = workspaceService.createWorkspace('My Workspace');
        dispatch({ type: 'SET_WORKSPACE', payload: fallbackWorkspace });
      }
    };

    initializeWorkspace();
  }, []);

  // Action implementations
  const createWorkspace = useCallback(async (name: string): Promise<Workspace> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const workspace = workspaceService.createWorkspace(name);
      await workspaceService.saveWorkspace(workspace);
      dispatch({ type: 'SET_WORKSPACE', payload: workspace });
      return workspace;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create workspace';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const loadWorkspace = useCallback(async (id?: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const workspace = await workspaceService.loadWorkspace(id);
      dispatch({ type: 'SET_WORKSPACE', payload: workspace });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load workspace';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const saveWorkspace = useCallback(async (): Promise<void> => {
    if (!state.workspace) return;
    
    try {
      await workspaceService.saveWorkspace(state.workspace);
      // Mark all files as saved
      state.workspace.files.forEach(file => {
        if (file.isUnsaved) {
          workspaceService.markFileSaved(state.workspace!, file.id);
        }
      });
      dispatch({ type: 'SET_WORKSPACE', payload: state.workspace });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save workspace';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.workspace]);

  const renameWorkspace = useCallback((name: string): void => {
    dispatch({ type: 'UPDATE_WORKSPACE', payload: { name } });
  }, []);

  const createFile = useCallback((
    name: string, 
    featureContent?: string, 
    configContent?: string
  ): WorkspaceFile => {
    if (!state.workspace) {
      throw new Error('No workspace available');
    }

    const file = workspaceService.createFile(state.workspace, name, featureContent, configContent);
    // Service already mutated workspace, just trigger re-render
    dispatch({ type: 'SET_WORKSPACE', payload: state.workspace });
    return file;
  }, [state.workspace]);

  const deleteFile = useCallback((fileId: string): void => {
    if (!state.workspace) return;
    
    const success = workspaceService.deleteFile(state.workspace, fileId);
    if (success) {
      // Service already mutated workspace, just trigger re-render
      dispatch({ type: 'SET_WORKSPACE', payload: state.workspace });
    }
  }, [state.workspace]);

  const duplicateFile = useCallback((fileId: string, newName?: string): WorkspaceFile => {
    if (!state.workspace) {
      throw new Error('No workspace available');
    }

    const duplicate = workspaceService.duplicateFile(state.workspace, fileId, newName);
    if (!duplicate) {
      throw new Error('Failed to duplicate file');
    }

    // Service already mutated workspace, just trigger re-render
    dispatch({ type: 'SET_WORKSPACE', payload: state.workspace });
    return duplicate;
  }, [state.workspace]);

  const renameFile = useCallback((fileId: string, newName: string): void => {
    if (!state.workspace) return;
    
    const success = workspaceService.renameFile(state.workspace, fileId, newName);
    if (success) {
      // Service already mutated workspace, just trigger re-render
      dispatch({ type: 'SET_WORKSPACE', payload: state.workspace });
    }
  }, [state.workspace]);

  const setActiveFile = useCallback((fileId: string): void => {
    dispatch({ type: 'SET_ACTIVE_FILE', payload: fileId });
  }, []);

  const updateFileContent = useCallback((
    fileId: string, 
    featureContent?: string, 
    configContent?: string
  ): void => {
    if (!state.workspace) return;

    const hasChanges = workspaceService.updateFileContent(state.workspace, fileId, featureContent, configContent);
    
    if (hasChanges) {
      // Service already mutated workspace, just trigger re-render
      dispatch({ type: 'SET_WORKSPACE', payload: state.workspace });
    }
  }, [state.workspace]);

  const getActiveFile = useCallback((): WorkspaceFile | null => {
    if (!state.workspace) return null;
    return workspaceService.getActiveFile(state.workspace);
  }, [state.workspace]);

  const updateSettings = useCallback((settings: Partial<WorkspaceSettings>): void => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  const enableAutoSave = useCallback((): void => {
    updateSettings({ autoSave: true });
  }, [updateSettings]);

  const disableAutoSave = useCallback((): void => {
    updateSettings({ autoSave: false });
  }, [updateSettings]);

  const importWorkspace = useCallback(async (workspaceData: any): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const workspace = await workspaceService.importWorkspace(workspaceData);
      dispatch({ type: 'SET_WORKSPACE', payload: workspace });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import workspace';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const exportWorkspace = useCallback((): any => {
    if (!state.workspace) {
      throw new Error('No workspace to export');
    }
    return workspaceService.exportWorkspace(state.workspace);
  }, [state.workspace]);

  // Context value
  const contextValue: WorkspaceContextType = {
    ...state,
    createWorkspace,
    loadWorkspace,
    saveWorkspace,
    renameWorkspace,
    createFile,
    deleteFile,
    duplicateFile,
    renameFile,
    setActiveFile,
    updateFileContent,
    getActiveFile,
    updateSettings,
    enableAutoSave,
    disableAutoSave,
    importWorkspace,
    exportWorkspace
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
};

// Custom hook to use workspace context
export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

// Hook to get just the active file (commonly used)
export const useActiveFile = (): WorkspaceFile | null => {
  const { getActiveFile } = useWorkspace();
  return getActiveFile();
};

// Hook to check if workspace has unsaved changes
export const useHasUnsavedChanges = (): boolean => {
  const { hasUnsavedChanges } = useWorkspace();
  return hasUnsavedChanges;
};
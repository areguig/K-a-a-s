export interface WorkspaceFile {
  id: string;
  name: string;
  featureContent: string;
  configContent: string;
  lastModified: Date;
  isUnsaved: boolean;
  isActive?: boolean;
}

export interface WorkspaceSettings {
  autoSave: boolean;
  autoSaveInterval: number; // in milliseconds
  showFileExplorer: boolean;
  theme: 'light' | 'dark' | 'auto';
  defaultConfig: string;
}

export interface Workspace {
  id: string;
  name: string;
  files: WorkspaceFile[];
  activeFileId: string | null;
  lastModified: Date;
  settings: WorkspaceSettings;
  version: string; // for migration compatibility
}

export interface WorkspaceState {
  workspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
}

export interface WorkspaceActions {
  // Workspace operations
  createWorkspace: (name: string) => Promise<Workspace>;
  loadWorkspace: (id?: string) => Promise<void>;
  saveWorkspace: () => Promise<void>;
  renameWorkspace: (name: string) => void;
  
  // File operations
  createFile: (name: string, featureContent?: string, configContent?: string) => WorkspaceFile;
  deleteFile: (fileId: string) => void;
  duplicateFile: (fileId: string, newName?: string) => WorkspaceFile;
  renameFile: (fileId: string, newName: string) => void;
  setActiveFile: (fileId: string) => void;
  
  // Content operations
  updateFileContent: (fileId: string, featureContent?: string, configContent?: string) => void;
  getActiveFile: () => WorkspaceFile | null;
  
  // Settings
  updateSettings: (settings: Partial<WorkspaceSettings>) => void;
  
  // Auto-save
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  
  // Migration and import/export
  importWorkspace: (workspaceData: any) => Promise<void>;
  exportWorkspace: () => any;
}

// Migration interfaces
export interface LegacyData {
  featureContent?: string;
  configContent?: string;
  executionHistory?: any[];
}

export interface MigrationResult {
  success: boolean;
  workspace?: Workspace;
  error?: string;
  preservedHistory?: any[];
}

// Default configurations
export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  autoSave: true,
  autoSaveInterval: 30000, // 30 seconds
  showFileExplorer: true,
  theme: 'light',
  defaultConfig: JSON.stringify({
    logLevel: 'debug',
    retryCount: 0,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }, null, 2)
};

export const DEFAULT_FEATURE_CONTENT = `Feature: Sample API Tests

Background:
  * url 'https://jsonplaceholder.typicode.com'

Scenario: Get a post successfully
  Given path '/posts/1'
  When method GET
  Then status 200
  And match response contains { id: 1 }

Scenario: Get a non-existent post
  Given path '/posts/999'
  When method GET
  Then status 404

Scenario: Validate post schema
  Given path '/posts/1'
  When method GET
  Then status 200
  And match response == { id: '#number', userId: '#number', title: '#string', body: '#string' }`;

// Utility functions
export const generateFileId = (): string => {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateWorkspaceId = (): string => {
  return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const isValidFileName = (name: string): boolean => {
  // Check for valid filename (no special characters that would break file systems)
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  return name.length > 0 && name.length <= 255 && !invalidChars.test(name);
};

export const sanitizeFileName = (name: string): string => {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').substring(0, 255);
};

export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

export const ensureFeatureExtension = (filename: string): string => {
  if (!filename.endsWith('.feature')) {
    return `${filename}.feature`;
  }
  return filename;
};
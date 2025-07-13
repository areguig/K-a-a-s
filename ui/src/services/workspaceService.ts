import {
  Workspace,
  WorkspaceFile,
  WorkspaceSettings,
  LegacyData,
  MigrationResult,
  DEFAULT_WORKSPACE_SETTINGS,
  DEFAULT_FEATURE_CONTENT,
  generateFileId,
  generateWorkspaceId,
  sanitizeFileName,
  ensureFeatureExtension
} from '../types/workspace';

const WORKSPACE_STORAGE_KEY = 'kaas-workspace';
const LEGACY_FEATURE_KEY = 'kaas-editor-feature';
const LEGACY_CONFIG_KEY = 'kaas-editor-config';
const CURRENT_VERSION = '1.0.0';

class WorkspaceService {
  private currentWorkspace: Workspace | null = null;

  /**
   * Create a new workspace with default settings
   */
  createWorkspace(name: string): Workspace {
    const workspaceId = generateWorkspaceId();
    const defaultFileId = generateFileId();
    
    const defaultFile: WorkspaceFile = {
      id: defaultFileId,
      name: 'sample.feature',
      featureContent: DEFAULT_FEATURE_CONTENT,
      configContent: DEFAULT_WORKSPACE_SETTINGS.defaultConfig,
      lastModified: new Date(),
      isUnsaved: false
    };

    const workspace: Workspace = {
      id: workspaceId,
      name: sanitizeFileName(name),
      files: [defaultFile],
      activeFileId: defaultFileId,
      lastModified: new Date(),
      settings: { ...DEFAULT_WORKSPACE_SETTINGS },
      version: CURRENT_VERSION
    };

    this.currentWorkspace = workspace;
    return workspace;
  }

  /**
   * Load workspace from localStorage
   */
  async loadWorkspace(workspaceId?: string): Promise<Workspace | null> {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        return null;
      }

      // First, attempt to load existing workspace
      const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (stored) {
        const workspace = JSON.parse(stored) as Workspace;
        // Convert date strings back to Date objects
        workspace.lastModified = new Date(workspace.lastModified);
        workspace.files.forEach(file => {
          file.lastModified = new Date(file.lastModified);
        });
        
        this.currentWorkspace = workspace;
        return workspace;
      }

      // If no workspace exists, check for legacy data and migrate
      const migrationResult = await this.migrateLegacyData();
      if (migrationResult.success && migrationResult.workspace) {
        this.currentWorkspace = migrationResult.workspace;
        await this.saveWorkspace(migrationResult.workspace);
        return migrationResult.workspace;
      }

      // No existing data, return null
      return null;
    } catch (error) {
      console.error('Error loading workspace:', error);
      return null;
    }
  }

  /**
   * Save workspace to localStorage
   */
  async saveWorkspace(workspace?: Workspace): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      const workspaceToSave = workspace || this.currentWorkspace;
      if (!workspaceToSave) {
        throw new Error('No workspace to save');
      }

      workspaceToSave.lastModified = new Date();
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspaceToSave));
      this.currentWorkspace = workspaceToSave;
    } catch (error) {
      console.error('Error saving workspace:', error);
      throw error;
    }
  }

  /**
   * Get current workspace
   */
  getCurrentWorkspace(): Workspace | null {
    return this.currentWorkspace;
  }

  /**
   * Create a new file in the workspace
   */
  createFile(
    workspace: Workspace,
    name: string,
    featureContent?: string,
    configContent?: string
  ): WorkspaceFile {
    const fileId = generateFileId();
    const sanitizedName = ensureFeatureExtension(sanitizeFileName(name));
    
    // Ensure unique filename
    let uniqueName = sanitizedName;
    let counter = 1;
    while (workspace.files.some(f => f.name === uniqueName)) {
      const baseName = sanitizedName.replace('.feature', '');
      uniqueName = `${baseName}_${counter}.feature`;
      counter++;
    }

    const newFile: WorkspaceFile = {
      id: fileId,
      name: uniqueName,
      featureContent: featureContent || DEFAULT_FEATURE_CONTENT,
      configContent: configContent || workspace.settings.defaultConfig,
      lastModified: new Date(),
      isUnsaved: true
    };

    workspace.files.push(newFile);
    workspace.lastModified = new Date();
    
    return newFile;
  }

  /**
   * Delete a file from the workspace
   */
  deleteFile(workspace: Workspace, fileId: string): boolean {
    const index = workspace.files.findIndex(f => f.id === fileId);
    if (index === -1) {
      return false;
    }

    workspace.files.splice(index, 1);
    workspace.lastModified = new Date();

    // Mark workspace as having unsaved changes by marking remaining files as unsaved
    // This ensures auto-save will trigger to persist the deletion
    if (workspace.files.length > 0) {
      workspace.files[0].isUnsaved = true;
    }

    // If we deleted the active file, set a new active file
    if (workspace.activeFileId === fileId) {
      workspace.activeFileId = workspace.files.length > 0 ? workspace.files[0].id : null;
    }

    return true;
  }

  /**
   * Create a duplicate file (returns file object without mutating workspace)
   */
  duplicateFile(workspace: Workspace, fileId: string, newName?: string): WorkspaceFile | null {
    const originalFile = workspace.files.find(f => f.id === fileId);
    if (!originalFile) {
      return null;
    }

    const baseName = newName || originalFile.name.replace('.feature', '_copy');
    return this.createFile(
      workspace,
      baseName,
      originalFile.featureContent,
      originalFile.configContent
    );
  }

  /**
   * Rename a file in the workspace
   */
  renameFile(workspace: Workspace, fileId: string, newName: string): boolean {
    const file = workspace.files.find(f => f.id === fileId);
    if (!file) {
      return false;
    }

    const sanitizedName = ensureFeatureExtension(sanitizeFileName(newName));
    
    // Check for name conflicts
    if (workspace.files.some(f => f.id !== fileId && f.name === sanitizedName)) {
      throw new Error(`A file named "${sanitizedName}" already exists`);
    }

    file.name = sanitizedName;
    file.lastModified = new Date();
    workspace.lastModified = new Date();
    
    return true;
  }

  /**
   * Update file content
   */
  updateFileContent(
    workspace: Workspace,
    fileId: string,
    featureContent?: string,
    configContent?: string
  ): boolean {
    const file = workspace.files.find(f => f.id === fileId);
    if (!file) {
      return false;
    }

    let hasChanges = false;
    
    if (featureContent !== undefined && file.featureContent !== featureContent) {
      file.featureContent = featureContent;
      hasChanges = true;
    }
    
    if (configContent !== undefined && file.configContent !== configContent) {
      file.configContent = configContent;
      hasChanges = true;
    }

    if (hasChanges) {
      file.lastModified = new Date();
      file.isUnsaved = true;
      workspace.lastModified = new Date();
    }

    return hasChanges;
  }

  /**
   * Mark file as saved
   */
  markFileSaved(workspace: Workspace, fileId: string): boolean {
    const file = workspace.files.find(f => f.id === fileId);
    if (!file) {
      return false;
    }

    file.isUnsaved = false;
    return true;
  }

  /**
   * Get active file
   */
  getActiveFile(workspace: Workspace): WorkspaceFile | null {
    if (!workspace.activeFileId) {
      return workspace.files[0] || null;
    }
    return workspace.files.find(f => f.id === workspace.activeFileId) || null;
  }

  /**
   * Set active file
   */
  setActiveFile(workspace: Workspace, fileId: string): boolean {
    const file = workspace.files.find(f => f.id === fileId);
    if (!file) {
      return false;
    }

    workspace.activeFileId = fileId;
    return true;
  }

  /**
   * Update workspace settings
   */
  updateSettings(workspace: Workspace, settings: Partial<WorkspaceSettings>): void {
    workspace.settings = { ...workspace.settings, ...settings };
    workspace.lastModified = new Date();
  }

  /**
   * Check if workspace has unsaved changes
   */
  hasUnsavedChanges(workspace: Workspace): boolean {
    return workspace.files.some(file => file.isUnsaved);
  }

  /**
   * Export workspace data
   */
  exportWorkspace(workspace: Workspace): any {
    return {
      ...workspace,
      exportedAt: new Date().toISOString(),
      exportVersion: CURRENT_VERSION
    };
  }

  /**
   * Import workspace data
   */
  async importWorkspace(data: any): Promise<Workspace> {
    try {
      // Validate basic structure
      if (!data.id || !data.name || !Array.isArray(data.files)) {
        throw new Error('Invalid workspace format');
      }

      // Convert dates and sanitize data
      const workspace: Workspace = {
        id: data.id,
        name: sanitizeFileName(data.name),
        files: data.files.map((file: any) => ({
          id: file.id || generateFileId(),
          name: ensureFeatureExtension(sanitizeFileName(file.name || 'untitled')),
          featureContent: file.featureContent || DEFAULT_FEATURE_CONTENT,
          configContent: file.configContent || DEFAULT_WORKSPACE_SETTINGS.defaultConfig,
          lastModified: new Date(file.lastModified || Date.now()),
          isUnsaved: false
        })),
        activeFileId: data.activeFileId || (data.files[0]?.id || null),
        lastModified: new Date(data.lastModified || Date.now()),
        settings: { ...DEFAULT_WORKSPACE_SETTINGS, ...data.settings },
        version: CURRENT_VERSION
      };

      // Ensure at least one file exists
      if (workspace.files.length === 0) {
        const defaultFile = this.createFile(workspace, 'sample.feature');
        workspace.activeFileId = defaultFile.id;
      }

      this.currentWorkspace = workspace;
      await this.saveWorkspace(workspace);
      
      return workspace;
    } catch (error) {
      console.error('Error importing workspace:', error);
      throw error;
    }
  }

  /**
   * Migrate legacy single-file data to workspace format
   */
  private async migrateLegacyData(): Promise<MigrationResult> {
    try {
      if (typeof window === 'undefined') {
        return { success: false, error: 'Not in browser environment' };
      }

      const legacyFeature = localStorage.getItem(LEGACY_FEATURE_KEY);
      const legacyConfig = localStorage.getItem(LEGACY_CONFIG_KEY);

      if (!legacyFeature && !legacyConfig) {
        return { success: false, error: 'No legacy data found' };
      }

      console.log('Migrating legacy data to workspace format...');

      // Create new workspace with migrated data
      const workspace = this.createWorkspace('My Workspace');
      const defaultFile = workspace.files[0];

      if (legacyFeature) {
        defaultFile.featureContent = legacyFeature;
      }

      if (legacyConfig) {
        try {
          // Validate JSON before using
          JSON.parse(legacyConfig);
          defaultFile.configContent = legacyConfig;
        } catch {
          // Keep default config if legacy config is invalid
          console.warn('Legacy config is invalid JSON, using default');
        }
      }

      defaultFile.name = 'migrated.feature';
      defaultFile.lastModified = new Date();

      // Clear legacy data after successful migration
      localStorage.removeItem(LEGACY_FEATURE_KEY);
      localStorage.removeItem(LEGACY_CONFIG_KEY);

      console.log('Migration completed successfully');
      return { success: true, workspace };
    } catch (error) {
      console.error('Migration failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Clear all workspace data (for testing/reset)
   */
  async clearWorkspace(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    }
    this.currentWorkspace = null;
  }
}

// Export singleton instance
export const workspaceService = new WorkspaceService();
export default workspaceService;
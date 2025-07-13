import workspaceService from '../workspaceService';
import { Workspace, WorkspaceFile, DEFAULT_WORKSPACE_SETTINGS } from '../../types/workspace';

// Mock localStorage
interface MockLocalStorage {
  store: Map<string, string>;
  getItem: jest.Mock<string | null, [string]>;
  setItem: jest.Mock<void, [string, string]>;
  removeItem: jest.Mock<boolean, [string]>;
  clear: jest.Mock<void, []>;
}

const mockLocalStorage: MockLocalStorage = {
  store: new Map<string, string>(),
  getItem: jest.fn((key: string): string | null => mockLocalStorage.store.get(key) || null),
  setItem: jest.fn((key: string, value: string): void => {
    mockLocalStorage.store.set(key, value);
  }),
  removeItem: jest.fn((key: string): boolean => mockLocalStorage.store.delete(key)),
  clear: jest.fn((): void => {
    mockLocalStorage.store.clear();
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('WorkspaceService', () => {
  beforeEach(async () => {
    mockLocalStorage.store.clear();
    jest.clearAllMocks();
    await workspaceService.clearWorkspace();
  });

  describe('createWorkspace', () => {
    it('should create a new workspace with default file', () => {
      const workspace = workspaceService.createWorkspace('Test Workspace');
      
      expect(workspace.name).toBe('Test Workspace');
      expect(workspace.files).toHaveLength(1);
      expect(workspace.files[0].name).toBe('sample.feature');
      expect(workspace.activeFileId).toBe(workspace.files[0].id);
      expect(workspace.settings).toEqual(DEFAULT_WORKSPACE_SETTINGS);
    });

    it('should sanitize workspace name', () => {
      const workspace = workspaceService.createWorkspace('Test<>Workspace');
      expect(workspace.name).toBe('Test__Workspace');
    });
  });

  describe('saveWorkspace and loadWorkspace', () => {
    it('should save and load workspace correctly', async () => {
      const workspace = workspaceService.createWorkspace('Test Workspace');
      await workspaceService.saveWorkspace(workspace);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'kaas-workspace',
        expect.any(String)
      );

      const loaded = await workspaceService.loadWorkspace();
      expect(loaded).not.toBeNull();
      expect(loaded!.name).toBe('Test Workspace');
      expect(loaded!.files).toHaveLength(1);
    });

    it('should return null when no workspace exists', async () => {
      const loaded = await workspaceService.loadWorkspace();
      expect(loaded).toBeNull();
    });

    it('should handle corrupted data gracefully', async () => {
      mockLocalStorage.store.set('kaas-workspace', 'invalid json');
      const loaded = await workspaceService.loadWorkspace();
      expect(loaded).toBeNull();
    });
  });

  describe('file operations', () => {
    let workspace: Workspace;

    beforeEach(() => {
      workspace = workspaceService.createWorkspace('Test Workspace');
    });

    describe('createFile', () => {
      it('should create a new file with default content', () => {
        const file = workspaceService.createFile(workspace, 'new-test');
        
        expect(file.name).toBe('new-test.feature');
        expect(file.featureContent).toContain('Feature:');
        expect(file.configContent).toBe(DEFAULT_WORKSPACE_SETTINGS.defaultConfig);
        expect(workspace.files).toHaveLength(2);
      });

      it('should handle duplicate names by adding counter', () => {
        workspaceService.createFile(workspace, 'test.feature');
        const file2 = workspaceService.createFile(workspace, 'test.feature');
        
        expect(file2.name).toBe('test_1.feature');
      });

      it('should sanitize file names', () => {
        const file = workspaceService.createFile(workspace, 'test<>file');
        expect(file.name).toBe('test__file.feature');
      });
    });

    describe('deleteFile', () => {
      it('should delete file successfully', () => {
        const file = workspaceService.createFile(workspace, 'to-delete');
        const initialCount = workspace.files.length;
        
        const deleted = workspaceService.deleteFile(workspace, file.id);
        
        expect(deleted).toBe(true);
        expect(workspace.files).toHaveLength(initialCount - 1);
        expect(workspace.files.find(f => f.id === file.id)).toBeUndefined();
      });

      it('should update active file when deleting active file', () => {
        const file = workspaceService.createFile(workspace, 'to-delete');
        workspace.activeFileId = file.id;
        
        workspaceService.deleteFile(workspace, file.id);
        
        expect(workspace.activeFileId).not.toBe(file.id);
        expect(workspace.activeFileId).toBe(workspace.files[0]?.id || null);
      });

      it('should return false for non-existent file', () => {
        const deleted = workspaceService.deleteFile(workspace, 'non-existent');
        expect(deleted).toBe(false);
      });
    });

    describe('duplicateFile', () => {
      it('should duplicate file with copy suffix', () => {
        const originalFile = workspace.files[0];
        const duplicate = workspaceService.duplicateFile(workspace, originalFile.id);
        
        expect(duplicate).not.toBeNull();
        expect(duplicate!.name).toBe('sample_copy.feature');
        expect(duplicate!.featureContent).toBe(originalFile.featureContent);
        expect(duplicate!.configContent).toBe(originalFile.configContent);
        expect(duplicate!.id).not.toBe(originalFile.id);
      });

      it('should use custom name when provided', () => {
        const originalFile = workspace.files[0];
        const duplicate = workspaceService.duplicateFile(workspace, originalFile.id, 'custom-name');
        
        expect(duplicate!.name).toBe('custom-name.feature');
      });

      it('should return null for non-existent file', () => {
        const duplicate = workspaceService.duplicateFile(workspace, 'non-existent');
        expect(duplicate).toBeNull();
      });
    });

    describe('renameFile', () => {
      it('should rename file successfully', () => {
        const file = workspace.files[0];
        const renamed = workspaceService.renameFile(workspace, file.id, 'new-name');
        
        expect(renamed).toBe(true);
        expect(file.name).toBe('new-name.feature');
      });

      it('should prevent duplicate names', () => {
        const file1 = workspace.files[0];
        const file2 = workspaceService.createFile(workspace, 'other-file');
        
        expect(() => {
          workspaceService.renameFile(workspace, file2.id, file1.name);
        }).toThrow('already exists');
      });

      it('should return false for non-existent file', () => {
        const renamed = workspaceService.renameFile(workspace, 'non-existent', 'new-name');
        expect(renamed).toBe(false);
      });
    });

    describe('updateFileContent', () => {
      it('should update feature content', () => {
        const file = workspace.files[0];
        const originalContent = file.featureContent;
        const newContent = 'New feature content';
        
        const updated = workspaceService.updateFileContent(workspace, file.id, newContent);
        
        expect(updated).toBe(true);
        expect(file.featureContent).toBe(newContent);
        expect(file.isUnsaved).toBe(true);
      });

      it('should update config content', () => {
        const file = workspace.files[0];
        const newConfig = '{"newConfig": true}';
        
        const updated = workspaceService.updateFileContent(workspace, file.id, undefined, newConfig);
        
        expect(updated).toBe(true);
        expect(file.configContent).toBe(newConfig);
        expect(file.isUnsaved).toBe(true);
      });

      it('should return false when no changes made', () => {
        const file = workspace.files[0];
        const updated = workspaceService.updateFileContent(
          workspace, 
          file.id, 
          file.featureContent, 
          file.configContent
        );
        
        expect(updated).toBe(false);
        expect(file.isUnsaved).toBe(false);
      });
    });

    describe('markFileSaved', () => {
      it('should mark file as saved', () => {
        const file = workspace.files[0];
        file.isUnsaved = true;
        
        const marked = workspaceService.markFileSaved(workspace, file.id);
        
        expect(marked).toBe(true);
        expect(file.isUnsaved).toBe(false);
      });
    });
  });

  describe('active file management', () => {
    let workspace: Workspace;

    beforeEach(() => {
      workspace = workspaceService.createWorkspace('Test Workspace');
    });

    describe('getActiveFile', () => {
      it('should return active file when set', () => {
        const activeFile = workspaceService.getActiveFile(workspace);
        expect(activeFile).toBe(workspace.files[0]);
      });

      it('should return first file when no active file set', () => {
        workspace.activeFileId = null;
        const activeFile = workspaceService.getActiveFile(workspace);
        expect(activeFile).toBe(workspace.files[0]);
      });

      it('should return null when no files exist', () => {
        workspace.files = [];
        workspace.activeFileId = null;
        const activeFile = workspaceService.getActiveFile(workspace);
        expect(activeFile).toBeNull();
      });
    });

    describe('setActiveFile', () => {
      it('should set active file successfully', () => {
        const newFile = workspaceService.createFile(workspace, 'new-file');
        const set = workspaceService.setActiveFile(workspace, newFile.id);
        
        expect(set).toBe(true);
        expect(workspace.activeFileId).toBe(newFile.id);
      });

      it('should return false for non-existent file', () => {
        const set = workspaceService.setActiveFile(workspace, 'non-existent');
        expect(set).toBe(false);
      });
    });
  });

  describe('utility functions', () => {
    let workspace: Workspace;

    beforeEach(() => {
      workspace = workspaceService.createWorkspace('Test Workspace');
    });

    describe('hasUnsavedChanges', () => {
      it('should return false when no unsaved changes', () => {
        expect(workspaceService.hasUnsavedChanges(workspace)).toBe(false);
      });

      it('should return true when files have unsaved changes', () => {
        workspace.files[0].isUnsaved = true;
        expect(workspaceService.hasUnsavedChanges(workspace)).toBe(true);
      });
    });

    describe('exportWorkspace', () => {
      it('should export workspace with metadata', () => {
        const exported = workspaceService.exportWorkspace(workspace);
        
        expect(exported.id).toBe(workspace.id);
        expect(exported.name).toBe(workspace.name);
        expect(exported.exportedAt).toBeDefined();
        expect(exported.exportVersion).toBeDefined();
      });
    });

    describe('importWorkspace', () => {
      it('should import valid workspace data', async () => {
        const exportedData = workspaceService.exportWorkspace(workspace);
        const imported = await workspaceService.importWorkspace(exportedData);
        
        expect(imported.name).toBe(workspace.name);
        expect(imported.files).toHaveLength(workspace.files.length);
      });

      it('should handle invalid data', async () => {
        await expect(workspaceService.importWorkspace({})).rejects.toThrow('Invalid workspace format');
      });

      it('should create default file when none exist', async () => {
        const invalidData = {
          id: 'test',
          name: 'Test',
          files: []
        };
        
        const imported = await workspaceService.importWorkspace(invalidData);
        expect(imported.files).toHaveLength(1);
      });
    });
  });

  describe('migration', () => {
    it('should migrate legacy data when available', async () => {
      // Setup legacy data
      mockLocalStorage.store.set('kaas-editor-feature', 'Legacy feature content');
      mockLocalStorage.store.set('kaas-editor-config', '{"legacy": true}');
      
      const workspace = await workspaceService.loadWorkspace();
      
      expect(workspace).not.toBeNull();
      expect(workspace!.files[0].featureContent).toBe('Legacy feature content');
      expect(workspace!.files[0].configContent).toBe('{"legacy": true}');
      expect(workspace!.files[0].name).toBe('migrated.feature');
      
      // Legacy data should be cleared
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kaas-editor-feature');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kaas-editor-config');
    });

    it('should handle invalid legacy config gracefully', async () => {
      mockLocalStorage.store.set('kaas-editor-feature', 'Legacy feature content');
      mockLocalStorage.store.set('kaas-editor-config', 'invalid json');
      
      const workspace = await workspaceService.loadWorkspace();
      
      expect(workspace).not.toBeNull();
      expect(workspace!.files[0].configContent).toBe(DEFAULT_WORKSPACE_SETTINGS.defaultConfig);
    });
  });
});
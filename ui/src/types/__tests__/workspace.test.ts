import {
  generateFileId,
  generateWorkspaceId,
  isValidFileName,
  sanitizeFileName,
  getFileExtension,
  ensureFeatureExtension,
  DEFAULT_WORKSPACE_SETTINGS,
  DEFAULT_FEATURE_CONTENT
} from '../workspace';

describe('workspace utilities', () => {
  describe('generateFileId', () => {
    it('should generate unique file IDs', () => {
      const id1 = generateFileId();
      const id2 = generateFileId();
      
      expect(id1).toMatch(/^file_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^file_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('generateWorkspaceId', () => {
    it('should generate unique workspace IDs', () => {
      const id1 = generateWorkspaceId();
      const id2 = generateWorkspaceId();
      
      expect(id1).toMatch(/^ws_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^ws_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('isValidFileName', () => {
    it('should validate correct filenames', () => {
      expect(isValidFileName('test.feature')).toBe(true);
      expect(isValidFileName('my-test-file')).toBe(true);
      expect(isValidFileName('test_file_123')).toBe(true);
      expect(isValidFileName('test file with spaces')).toBe(true);
    });

    it('should reject invalid filenames', () => {
      expect(isValidFileName('')).toBe(false);
      expect(isValidFileName('test<file')).toBe(false);
      expect(isValidFileName('test>file')).toBe(false);
      expect(isValidFileName('test:file')).toBe(false);
      expect(isValidFileName('test"file')).toBe(false);
      expect(isValidFileName('test/file')).toBe(false);
      expect(isValidFileName('test\\file')).toBe(false);
      expect(isValidFileName('test|file')).toBe(false);
      expect(isValidFileName('test?file')).toBe(false);
      expect(isValidFileName('test*file')).toBe(false);
    });

    it('should reject filenames that are too long', () => {
      const longName = 'a'.repeat(256);
      expect(isValidFileName(longName)).toBe(false);
    });
  });

  describe('sanitizeFileName', () => {
    it('should sanitize invalid characters', () => {
      expect(sanitizeFileName('test<file')).toBe('test_file');
      expect(sanitizeFileName('test>file')).toBe('test_file');
      expect(sanitizeFileName('test:file')).toBe('test_file');
      expect(sanitizeFileName('test"file')).toBe('test_file');
      expect(sanitizeFileName('test/file')).toBe('test_file');
      expect(sanitizeFileName('test\\file')).toBe('test_file');
      expect(sanitizeFileName('test|file')).toBe('test_file');
      expect(sanitizeFileName('test?file')).toBe('test_file');
      expect(sanitizeFileName('test*file')).toBe('test_file');
    });

    it('should truncate long filenames', () => {
      const longName = 'a'.repeat(300);
      const sanitized = sanitizeFileName(longName);
      expect(sanitized.length).toBe(255);
    });

    it('should preserve valid filenames', () => {
      expect(sanitizeFileName('test.feature')).toBe('test.feature');
      expect(sanitizeFileName('my-test-file')).toBe('my-test-file');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions correctly', () => {
      expect(getFileExtension('test.feature')).toBe('feature');
      expect(getFileExtension('config.json')).toBe('json');
      expect(getFileExtension('file.txt')).toBe('txt');
      expect(getFileExtension('file.tar.gz')).toBe('gz');
    });

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('filename')).toBe('');
      expect(getFileExtension('.')).toBe('');
    });
  });

  describe('ensureFeatureExtension', () => {
    it('should add .feature extension if missing', () => {
      expect(ensureFeatureExtension('test')).toBe('test.feature');
      expect(ensureFeatureExtension('my-test')).toBe('my-test.feature');
    });

    it('should not add extension if already present', () => {
      expect(ensureFeatureExtension('test.feature')).toBe('test.feature');
      expect(ensureFeatureExtension('my-test.feature')).toBe('my-test.feature');
    });
  });

  describe('default configurations', () => {
    it('should have valid default workspace settings', () => {
      expect(DEFAULT_WORKSPACE_SETTINGS.autoSave).toBe(true);
      expect(DEFAULT_WORKSPACE_SETTINGS.autoSaveInterval).toBe(30000);
      expect(DEFAULT_WORKSPACE_SETTINGS.showFileExplorer).toBe(true);
      expect(DEFAULT_WORKSPACE_SETTINGS.theme).toBe('light');
      expect(typeof DEFAULT_WORKSPACE_SETTINGS.defaultConfig).toBe('string');
    });

    it('should have valid default feature content', () => {
      expect(DEFAULT_FEATURE_CONTENT).toContain('Feature:');
      expect(DEFAULT_FEATURE_CONTENT).toContain('Scenario:');
      expect(DEFAULT_FEATURE_CONTENT).toContain('Given');
      expect(DEFAULT_FEATURE_CONTENT).toContain('When');
      expect(DEFAULT_FEATURE_CONTENT).toContain('Then');
    });

    it('should have parseable default config', () => {
      expect(() => JSON.parse(DEFAULT_WORKSPACE_SETTINGS.defaultConfig)).not.toThrow();
      
      const config = JSON.parse(DEFAULT_WORKSPACE_SETTINGS.defaultConfig);
      expect(config.logLevel).toBe('debug');
      expect(config.retryCount).toBe(0);
      expect(config.headers).toBeDefined();
    });
  });
});
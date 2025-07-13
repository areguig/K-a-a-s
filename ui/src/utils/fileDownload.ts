import { WorkspaceFile, Workspace } from '../types/workspace';

/**
 * Download a single file
 */
export const downloadFile = (file: WorkspaceFile, includeConfig: boolean = true): void => {
  try {
    if (includeConfig) {
      // Download as a ZIP-like structure with both feature and config files
      downloadAsZip(file);
    } else {
      // Download just the feature file
      downloadSingleFile(file.featureContent, file.name, 'text/plain');
    }
  } catch (error) {
    console.error('Failed to download file:', error);
    throw new Error('Failed to download file');
  }
};

/**
 * Download the entire workspace as JSON
 */
export const downloadWorkspace = (workspace: Workspace): void => {
  try {
    const workspaceData = {
      ...workspace,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0.0'
    };
    
    const content = JSON.stringify(workspaceData, null, 2);
    const filename = `${workspace.name.replace(/[^a-zA-Z0-9]/g, '_')}_workspace.json`;
    
    downloadSingleFile(content, filename, 'application/json');
  } catch (error) {
    console.error('Failed to download workspace:', error);
    throw new Error('Failed to download workspace');
  }
};

/**
 * Download multiple files as individual downloads
 */
export const downloadMultipleFiles = (files: WorkspaceFile[]): void => {
  files.forEach((file, index) => {
    // Add a small delay between downloads to avoid browser blocking
    setTimeout(() => {
      downloadFile(file, false);
    }, index * 100);
  });
};

/**
 * Create and download a text file
 */
const downloadSingleFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the object URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * Download file with both feature and config content as separate files in a sequence
 */
const downloadAsZip = (file: WorkspaceFile): void => {
  // Since we can't create actual ZIP files without additional libraries,
  // we'll download both files separately with a small delay
  
  // Download feature file
  downloadSingleFile(file.featureContent, file.name, 'text/plain');
  
  // Download config file after a short delay
  setTimeout(() => {
    const configFilename = file.name.replace('.feature', '.json');
    downloadSingleFile(file.configContent, configFilename, 'application/json');
  }, 100);
};

/**
 * Create a downloadable link for sharing
 */
export const createShareableLink = (file: WorkspaceFile): string => {
  try {
    const data = {
      name: file.name,
      featureContent: file.featureContent,
      configContent: file.configContent,
      sharedAt: new Date().toISOString()
    };
    
    // Create a data URL that could be shared
    const content = JSON.stringify(data);
    const blob = new Blob([content], { type: 'application/json' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Failed to create shareable link:', error);
    throw new Error('Failed to create shareable link');
  }
};

/**
 * Copy file content to clipboard
 */
export const copyToClipboard = async (file: WorkspaceFile, contentType: 'feature' | 'config' | 'both' = 'feature'): Promise<void> => {
  try {
    let content = '';
    
    switch (contentType) {
      case 'feature':
        content = file.featureContent;
        break;
      case 'config':
        content = file.configContent;
        break;
      case 'both':
        content = `# Feature File: ${file.name}\n\n${file.featureContent}\n\n# Configuration\n\n${file.configContent}`;
        break;
    }
    
    await navigator.clipboard.writeText(content);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    throw new Error('Failed to copy to clipboard');
  }
};

/**
 * Validate file content before download
 */
export const validateFileForDownload = (file: WorkspaceFile): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!file.name || file.name.trim().length === 0) {
    errors.push('File name is required');
  }
  
  if (!file.featureContent || file.featureContent.trim().length === 0) {
    errors.push('Feature content is required');
  }
  
  try {
    JSON.parse(file.configContent);
  } catch {
    errors.push('Configuration is not valid JSON');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
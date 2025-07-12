import { useState, useEffect } from 'react';
import { FileText, Settings, Maximize2, Minimize2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { setupGherkinLanguage } from '../utils/gherkin';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false }
);

interface TabbedEditorProps {
  featureContent: string;
  configContent: string;
  onFeatureChange: (value: string) => void;
  onConfigChange: (value: string) => void;
}

type TabType = 'feature' | 'config';

export const TabbedEditor: React.FC<TabbedEditorProps> = ({
  featureContent,
  configContent,
  onFeatureChange,
  onConfigChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('feature');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const tabs = [
    {
      id: 'feature' as TabType,
      label: 'Feature File',
      icon: FileText,
      language: 'gherkin',
      content: featureContent,
      onChange: onFeatureChange,
    },
    {
      id: 'config' as TabType,
      label: 'Configuration',
      icon: Settings,
      language: 'json',
      content: configContent,
      onChange: onConfigChange,
    },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab)!;

  return (
    <div 
      className={`card-elevated transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50' : ''
      }`}
    >
      {/* Tab Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-surface-secondary rounded-t-2xl">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-brand-primary border-b-2 border-brand-primary bg-surface-primary'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="mr-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Editor Content */}
      <div className={`${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[400px]'}`}>
        <MonacoEditor
          height="100%"
          language={activeTabData.language}
          theme="kaas-light"
          value={activeTabData.content}
          onChange={(value) => activeTabData.onChange(value || '')}
          onMount={(editor, monaco) => {
            // Setup syntax highlighting when Monaco is mounted
            try {
              setupGherkinLanguage(monaco);
            } catch (error) {
              console.error('Failed to setup Gherkin language:', error);
            }
          }}
          options={{
            minimap: { enabled: isFullscreen },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            folding: true,
            matchBrackets: 'always',
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            contextmenu: true,
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>

      {/* Footer with file info */}
      <div className="px-4 py-2 bg-surface-secondary text-caption border-t border-gray-200 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <span>
            {activeTabData.language === 'gherkin' ? 'Gherkin' : 'JSON'} • 
            {activeTabData.content.split('\n').length} lines
          </span>
          <span className="font-mono">
            {activeTabData.language === 'gherkin' ? '.feature' : '.json'}
          </span>
        </div>
      </div>
    </div>
  );
};
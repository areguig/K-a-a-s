'use client';

import { useState, useEffect } from 'react';
import { KarateVersions, KarateResult } from '../types/karate';
import { Header } from '../components/Header';
import { TabbedEditor } from '../components/TabbedEditor';
import { ScenarioView } from '../components/ScenarioView';
import { ResultsSummary } from '../components/ResultsSummary';
import { HistoryPanel } from '../components/HistoryPanel';
import { EditorResultsPanel } from '../components/ResizablePanel';
import { ActivityBar } from '../components/ActivityBar';
import { EditorToolbar } from '../components/EditorToolbar';
import { FileExplorer } from '../components/FileExplorer';
import { FileTabs } from '../components/FileTabs';
import { useWorkspace, useActiveFile } from '../contexts/WorkspaceContext';
import { useExecutionHistory } from '../hooks/useExecutionHistory';
import { ExecutionHistory } from '../types/history';
import { highlightFailedSteps } from '../utils/monaco';
import { executeFeature, fetchVersions } from '../services/karateService';
import { downloadFile, downloadWorkspace } from '../utils/fileDownload';

const DEFAULT_FEATURE = `Feature: Sample API Tests

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
  And match response == { id: '#number', userId: '#number', title: '#string', body: '#string' }

Scenario: Intentionally failing test
  Given path '/posts/1'
  When method GET
  Then status 200
  And match response == { wrongField: '#present' }`;

export default function Home() {
  const { workspace, updateFileContent, isLoading, saveWorkspace, hasUnsavedChanges } = useWorkspace();
  const activeFile = useActiveFile();
  const [result, setResult] = useState<KarateResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<KarateVersions>({ karate: '', java: '' });
  const [expandedScenarios, setExpandedScenarios] = useState<{ [key: string]: boolean }>({});
  const [expandedErrors, setExpandedErrors] = useState<{ [key: string]: boolean }>({});
  const [showHistory, setShowHistory] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  
  const { saveExecution } = useExecutionHistory();

  useEffect(() => {
    const loadVersions = async () => {
      try {
        const versions = await fetchVersions();
        setVersions(versions);
      } catch (err) {
        console.error('Error fetching versions:', err);
      }
    };
    loadVersions();
  }, []);

  const handleRunTests = async () => {
    if (!activeFile) {
      setError('No active file to run');
      return;
    }

    setIsRunning(true);
    setError(null);
    setLogs([]);
    try {
      const karateResult = await executeFeature(activeFile.featureContent, activeFile.configContent);
      setResult(karateResult);
      setLogs(karateResult.logs || []);
      
      // Save execution to history
      saveExecution(activeFile.featureContent, activeFile.configContent, karateResult);
    } catch (err) {
      console.error('Error executing feature:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleScenario = (scenarioId: string) => {
    setExpandedScenarios(prev => ({
      ...prev,
      [scenarioId]: !prev[scenarioId]
    }));
  };

  const toggleError = (stepId: string) => {
    setExpandedErrors(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const handleLoadHistory = (execution: ExecutionHistory) => {
    if (!activeFile) return;

    // Check if there are unsaved changes
    const hasUnsavedChanges = activeFile.isUnsaved;

    if (hasUnsavedChanges) {
      const confirmLoad = window.confirm(
        'You have unsaved changes in the current file. Loading from history will replace your current work. Continue?'
      );
      if (!confirmLoad) return;
    }

    // Load the execution from history into current file
    updateFileContent(activeFile.id, execution.featureContent, execution.configContent);
    setShowHistory(false);
    
    // Clear current results
    setResult(null);
    setError(null);
    setLogs([]);
  };

  const handleDownloadFile = () => {
    if (activeFile) {
      try {
        downloadFile(activeFile);
      } catch (error) {
        console.error('Failed to download file:', error);
        setError('Failed to download file');
      }
    }
  };

  const handleDownloadWorkspace = () => {
    if (workspace) {
      try {
        downloadWorkspace(workspace);
      } catch (error) {
        console.error('Failed to download workspace:', error);
        setError('Failed to download workspace');
      }
    }
  };

  const handleSaveWorkspace = async () => {
    try {
      await saveWorkspace();
    } catch (error) {
      console.error('Failed to save workspace:', error);
      setError('Failed to save workspace');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        versions={versions}
        isRunning={isRunning}
        lastExecutionTime={result?.time}
        onShowHistory={() => setShowHistory(true)}
      />
      <main className="h-[calc(100vh-120px)] flex">
        {/* Activity Bar */}
        <ActivityBar 
          showFileExplorer={showFileExplorer}
          onToggleFileExplorer={() => setShowFileExplorer(!showFileExplorer)}
        />
        
        {/* File Explorer Sidebar */}
        <div className={`bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out ${
          showFileExplorer ? 'w-80' : 'w-0'
        } overflow-hidden`}>
          {showFileExplorer && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-100">
                <h3 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Explorer</h3>
              </div>
              <div className="flex-1 overflow-hidden">
                <FileExplorer className="h-full" />
              </div>
            </div>
          )}
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 min-w-0 h-full">
          <EditorResultsPanel
                editorContent={
                  <div className="h-full flex flex-col">
                    <FileTabs className="flex-shrink-0" />
                    <EditorToolbar
                      activeFileName={activeFile?.name}
                      hasUnsavedChanges={hasUnsavedChanges}
                      isRunning={isRunning}
                      isApiConnected={versions?.karate ? true : false}
                      onRunTests={handleRunTests}
                      onSaveWorkspace={handleSaveWorkspace}
                      onDownloadFile={handleDownloadFile}
                      onDownloadWorkspace={handleDownloadWorkspace}
                      onShowHistory={() => setShowHistory(true)}
                    />
                    <div className="flex-1 min-h-0">
                      {activeFile ? (
                        <TabbedEditor
                          featureContent={activeFile.featureContent}
                          configContent={activeFile.configContent}
                          onFeatureChange={(value) => updateFileContent(activeFile.id, value, undefined)}
                          onConfigChange={(value) => updateFileContent(activeFile.id, undefined, value)}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                          <div className="text-center">
                            <p className="text-lg mb-2">No file selected</p>
                            <p className="text-sm">
                              {!showFileExplorer ? (
                                <button 
                                  onClick={() => setShowFileExplorer(true)}
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  Open file explorer
                                </button>
                              ) : (
                                "Select a file from the explorer to start editing"
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                }
            resultsContent={
              <div className="h-full overflow-y-auto space-y-8 p-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-red-800 font-medium">Error</h3>
                    <p className="text-red-600 mt-1">{error}</p>
                  </div>
                )}

                {result && (
                  <>
                    {/* Test Results Summary */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <ResultsSummary result={result} isRunning={isRunning} />
                    </div>

                    {/* Detailed Test Results */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <h2 className="text-lg font-semibold mb-4">Test Results</h2>
                      <div className="space-y-4">
                        {result.scenariosList.map((scenario, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <h3 className="font-medium mb-2">{scenario.name}</h3>
                            <ScenarioView
                              key={`scenario-${index}`}
                              scenario={scenario}
                              expanded={expandedScenarios[scenario.name] || false}
                              onToggle={() => toggleScenario(scenario.name)}
                              onToggleError={toggleError}
                              expandedErrors={expandedErrors}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Logs Section */}
                    {logs && logs.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-lg font-semibold">Execution Logs</h2>
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigator.clipboard.writeText(logs.join('\n'))}
                              className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
                            >
                              Copy Logs
                            </button>
                            <button
                              onClick={() => {
                                const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'karate-execution-logs.txt';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                window.URL.revokeObjectURL(url);
                              }}
                              className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
                            >
                              Download Logs
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded font-mono text-sm whitespace-pre-wrap max-h-[300px] overflow-auto">
                          {logs.join('\n')}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {versions.karate && (
                  <div className="text-sm text-gray-600">
                    Using Karate {versions.karate} with Java {versions.java}
                  </div>
                )}
              </div>
            }
          />
        </div>
      </main>

      {/* Execution History Panel */}
      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onLoadHistory={handleLoadHistory}
      />
    </div>
  );
}

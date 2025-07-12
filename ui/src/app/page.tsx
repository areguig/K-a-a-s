'use client';

import { useState, useEffect } from 'react';
import { KarateVersions, KarateResult } from '../types/karate';
import { Header } from '../components/Header';
import { TabbedEditor } from '../components/TabbedEditor';
import { ScenarioView } from '../components/ScenarioView';
import { ResultsSummary } from '../components/ResultsSummary';
import { HistoryPanel } from '../components/HistoryPanel';
import { useExecutionHistory } from '../hooks/useExecutionHistory';
import { ExecutionHistory } from '../types/history';
import { highlightFailedSteps } from '../utils/monaco';
import { executeFeature, fetchVersions } from '../services/karateService';

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
  const [featureContent, setFeatureContent] = useState<string>(DEFAULT_FEATURE);
  const [configState, setConfigState] = useState(JSON.stringify({
    logLevel: 'debug',
    retryCount: 0,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }, null, 2));
  const [result, setResult] = useState<KarateResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<KarateVersions>({ karate: '', java: '' });
  const [expandedScenarios, setExpandedScenarios] = useState<{ [key: string]: boolean }>({});
  const [expandedErrors, setExpandedErrors] = useState<{ [key: string]: boolean }>({});
  const [showHistory, setShowHistory] = useState(false);
  
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
    setIsRunning(true);
    setError(null);
    setLogs([]);
    try {
      const karateResult = await executeFeature(featureContent, configState);
      setResult(karateResult);
      setLogs(karateResult.logs || []);
      
      // Save execution to history
      saveExecution(featureContent, configState, karateResult);
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
    // Check if there are unsaved changes
    const hasUnsavedChanges = 
      featureContent !== DEFAULT_FEATURE || 
      configState !== JSON.stringify({
        logLevel: 'debug',
        retryCount: 0,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }, null, 2);

    if (hasUnsavedChanges) {
      const confirmLoad = window.confirm(
        'You have unsaved changes in the editor. Loading from history will replace your current work. Continue?'
      );
      if (!confirmLoad) return;
    }

    // Load the execution from history
    setFeatureContent(execution.featureContent);
    setConfigState(execution.configContent);
    setShowHistory(false);
    
    // Clear current results
    setResult(null);
    setError(null);
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        versions={versions}
        isRunning={isRunning}
        lastExecutionTime={result?.time}
        onRunTests={handleRunTests}
        onShowHistory={() => setShowHistory(true)}
      />
      <main className="p-8">
        <div className="max-w-7xl mx-auto">

        {/* Tabbed Editor */}
        <div className="mb-8">
          <TabbedEditor
            featureContent={featureContent}
            configContent={configState}
            onFeatureChange={(value) => setFeatureContent(value)}
            onConfigChange={(value) => setConfigState(value)}
          />
        </div>

        {/* Test Results and Logs */}
        <div className="space-y-8">
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
                <ResultsSummary result={result} />
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

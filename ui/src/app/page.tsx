'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { type Monaco, type EditorProps } from '@monaco-editor/react';
import { KarateVersions, KarateResult } from '../types/karate';
import { Header } from '../components/Header';
import { ScenarioView } from '../components/ScenarioView';
import { ResultsSummary } from '../components/ResultsSummary';
import { highlightFailedSteps } from '../utils/monaco';
import { executeFeature, fetchVersions } from '../services/karateService';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false }
);

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
  const [editorRef, setEditorRef] = useState<Parameters<NonNullable<EditorProps['onMount']>>[0] | null>(null);
  const [expandedScenarios, setExpandedScenarios] = useState<{ [key: string]: boolean }>({});
  const [expandedErrors, setExpandedErrors] = useState<{ [key: string]: boolean }>({});

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        versions={versions}
        isRunning={isRunning}
        lastExecutionTime={result?.time}
        onRunTests={handleRunTests}
      />
      <main className="p-8">
        <div className="max-w-7xl mx-auto">

        {/* Feature and Config boxes side by side */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4">Feature File</h2>
            <div className="h-[400px] border rounded">
              <MonacoEditor
                height="100%"
                defaultLanguage="gherkin"
                theme="vs-light"
                value={featureContent}
                onChange={(value) => setFeatureContent(value || '')}
                onMount={(editor) => setEditorRef(editor)}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4">Configuration</h2>
            <div className="h-[400px] border rounded">
              <MonacoEditor
                height="100%"
                defaultLanguage="json"
                theme="vs-light"
                value={configState}
                onChange={(value) => setConfigState(value || '')}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>
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
    </div>
  );
}

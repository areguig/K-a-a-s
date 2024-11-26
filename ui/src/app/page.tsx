'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import config from './config';
import type { editor } from 'monaco-editor';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false }
);

interface KarateVersions {
  karate: string;
  java: string;
}

interface KarateStep {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  errorMessage?: string;
}

interface KarateScenario {
  name: string;
  steps: KarateStep[];
  status: 'passed' | 'failed' | 'skipped';
}

interface KarateResult {
  scenario?: KarateScenario;
  scenariosList: KarateScenario[];
  steps?: KarateStep[];
  status: 'passed' | 'failed';
  time?: number;
  features: {
    passed: number;
    total: number;
  };
  scenarios: {
    passed: number;
    total: number;
    failed: number;
  };
  htmlReport?: string;
}

const defaultFeature = `Feature: Sample API Tests

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
  const [feature, setFeature] = useState(defaultFeature);
  const [configState, setConfigState] = useState(JSON.stringify({
    logLevel: 'debug',
    retryCount: 0,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }, null, 2));
  const [result, setResult] = useState<KarateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<KarateVersions>({ karate: '', java: '' });
  const [logs, setLogs] = useState<string[]>([]);
  const [htmlReport, setHtmlReport] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editorRef, setEditorRef] = useState<editor.IStandaloneCodeEditor | null>(null);
  const [expandedScenarios, setExpandedScenarios] = useState<{ [key: string]: boolean }>({});
  const [expandedErrors, setExpandedErrors] = useState<{ [key: string]: boolean }>({});

  const highlightFailedSteps = (editor: editor.IStandaloneCodeEditor, monaco: any, result: KarateResult) => {
    if (!editor || !result) return;

    const model = editor.getModel();
    if (!model) return;

    const decorations = [];
    const lines = model.getLinesContent();

    const findStepLine = (stepText: string): number => {
      if (!stepText) return -1;
      return lines.findIndex(line => {
        if (!line) return false;
        const cleanLine = line.trim().toLowerCase();
        const cleanStep = stepText.trim().toLowerCase();
        return cleanLine.includes(cleanStep);
      }) + 1;
    };

    const processStep = (step: KarateStep) => {
      if (step?.status === 'failed' && step.name) {
        const lineNumber = findStepLine(step.name);
        if (lineNumber > 0) {
          decorations.push({
            range: new monaco.Range(lineNumber, 1, lineNumber, 1),
            options: {
              isWholeLine: true,
              className: 'failedStepHighlight',
              glyphMarginClassName: 'failedStepGlyph',
              overviewRuler: {
                color: '#ef4444',
                position: monaco.editor.OverviewRulerLane.Right
              },
              minimap: {
                color: '#ef4444',
                position: monaco.editor.MinimapPosition.Inline
              },
              linesDecorationsClassName: 'failedStepDecoration'
            }
          });
        }
      }
    };

    if (result.steps?.length) {
      result.steps.forEach(processStep);
    }

    if (result.scenariosList?.length) {
      result.scenariosList.forEach(scenario => {
        scenario.steps?.forEach(processStep);
      });
    }

    if (result.scenario?.steps?.length) {
      result.scenario.steps.forEach(processStep);
    }

    editor.deltaDecorations([], decorations);
  };

  useEffect(() => {
    if (editorRef && result) {
      const monaco = (window as any).monaco;
      if (monaco) {
        highlightFailedSteps(editorRef, monaco, result);
      }
    }
  }, [editorRef, result]);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/karate/versions`);
        const data = await response.json();
        setVersions(data);
      } catch (error) {
        console.error('Error fetching versions:', error);
      }
    };
    fetchVersions();
  }, []);

  const executeFeature = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${config.apiUrl}/karate/execute`, {
        feature,
        config: JSON.parse(configState)
      });

      console.log('API Response:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.output) {
        const output = response.data.output;
        // Extract scenarios from feature content
        const scenarioMatches = output.featureContent.match(/Scenario:.*?(?=Scenario:|$)/gs);
        const scenariosList = scenarioMatches?.map(scenarioContent => {
          const scenarioName = scenarioContent.match(/Scenario:\s*(.*)/)?.[1] || 'Unnamed Scenario';
          // Extract step lines from scenario content
          const stepLines = scenarioContent.split('\n')
            .filter(line => /^\s*(Given|When|Then|And|But)\s+/.test(line))
            .map(line => line.trim());

          // Match steps with the lines from scenario content
          const scenarioSteps = stepLines.map(stepLine => {
            const [, keyword, text] = stepLine.match(/^\s*(Given|When|Then|And|But)\s+(.+)/) || [];
            // Find matching step from output.steps
            const matchingStep = output.steps.find(step => 
              step.keyword === keyword && step.text === text
            ) || {
              keyword,
              text,
              status: 'passed',
              error: undefined
            };
            return matchingStep;
          });

          return {
            name: scenarioName.trim(),
            steps: scenarioSteps,
            status: 'passed' as const
          };
        }) || [];

        // Update status based on steps
        scenariosList.forEach(scenario => {
          scenario.status = scenario.steps.some(step => step.errorMessage || step.status === 'failed') 
            ? 'failed' 
            : 'passed';
        });

        setResult({
          scenariosList,
          status: scenariosList.some(s => s.status === 'failed') ? 'failed' : 'passed',
          time: response.data.time || 0,
          features: {
            passed: response.data.features?.passed || 0,
            total: response.data.features?.total || 0
          },
          scenarios: {
            passed: scenariosList.filter(s => s.status === 'passed').length,
            failed: scenariosList.filter(s => s.status === 'failed').length,
            total: scenariosList.length
          },
          htmlReport: response.data.output.htmlReport || ''
        });
        setLogs(response.data.rawOutput || '');
        setHtmlReport(response.data.output.htmlReport || '');
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (err: any) {
      console.error('Error executing feature:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
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

  // Helper function to determine step status
  const getStepStatus = (step: any) => {
    if (step.status === 'failed' || (step.status === 'skipped' && step.errorMessage)) {
      return 'failed';
    }
    return step.status;
  };

  const StepView = ({ step }: { step: KarateStep }) => {
    const stepStatus = getStepStatus(step);
    
    return (
      <div className={`step p-2 border-l-4 ${
        stepStatus === 'passed' ? 'border-green-500 bg-green-50' : 
        stepStatus === 'failed' ? 'border-red-500 bg-red-50' : 
        'border-gray-500 bg-gray-50'
      } mb-2`}>
        <div 
          className="flex items-center cursor-pointer"
        >
          <span className={`status-icon mr-2 ${
            stepStatus === 'passed' ? 'text-green-500' : 
            stepStatus === 'failed' ? 'text-red-500' : 
            'text-gray-500'
          }`}>
            {stepStatus === 'passed' ? '✓' : stepStatus === 'failed' ? '✗' : '○'}
          </span>
          <span className="font-medium">{step.name}</span>
          {step.errorMessage && (
            <span className="text-sm text-gray-600 ml-2">
              ▶
            </span>
          )}
        </div>
        
        {step.errorMessage && (
          <div className="step-logs mt-2 pl-6">
            <pre className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {step.errorMessage}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const ScenarioView = ({ scenario, steps, status }: { 
    scenario: string; 
    steps: KarateStep[]; 
    status: 'passed' | 'failed' | 'skipped'; 
  }) => {
    const [expanded, setExpanded] = useState(false);
    const hasFailedSteps = steps.some(step => step.errorMessage || step.status === 'failed');
    const effectiveStatus = hasFailedSteps ? 'failed' : status;
    
    return (
      <div className={`scenario mb-4 border rounded-lg ${
        effectiveStatus === 'failed' ? 'border-red-200' : 'border-green-200'
      }`}>
        <div 
          className={`p-3 flex items-center justify-between cursor-pointer ${
            effectiveStatus === 'failed' ? 'bg-red-50' : 'bg-green-50'
          }`}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center">
            <span className={`mr-2 ${
              effectiveStatus === 'failed' ? 'text-red-500' : 'text-green-500'
            }`}>
              {effectiveStatus === 'failed' ? '✗' : '✓'}
            </span>
            <h4 className="font-medium">{scenario}</h4>
          </div>
          <span>{expanded ? '▼' : '▶'}</span>
        </div>
        
        {expanded && (
          <div className="p-3">
            {steps.map((step, index) => (
              <StepView key={index} step={{
                name: `${step.keyword} ${step.text}`,
                status: step.status,
                errorMessage: step.error
              }} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const TestResultView = ({ result }: { result: KarateResult }) => {
    if (!result) return null;

    const renderScenarios = () => {
      if (!result.scenariosList?.length) {
        return (
          <div className="text-gray-500 text-center py-4">
            No test results available
          </div>
        );
      }

      return result.scenariosList.map((scenario, index) => {
        const scenarioId = `scenario-${index}`;
        return (
          <div
            key={index}
            className={`border rounded-lg ${
              scenario.status === 'failed' ? 'border-red-200' : 'border-green-200'
            }`}
          >
            <div
              onClick={() => toggleScenario(scenarioId)}
              className={`p-4 flex items-center justify-between cursor-pointer ${
                scenario.status === 'failed' ? 'bg-red-50' : 'bg-green-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className={scenario.status === 'failed' ? 'text-red-500' : 'text-green-500'}>
                  {scenario.status === 'failed' ? '✗' : '✓'}
                </span>
                <h3 className="font-medium">{scenario.name}</h3>
              </div>
              <span className="transform transition-transform duration-200" style={{ 
                transform: expandedScenarios[scenarioId] ? 'rotate(90deg)' : 'rotate(0deg)'
              }}>
                ▶
              </span>
            </div>
            {expandedScenarios[scenarioId] && (
              <div className="p-4 space-y-2">
                {scenario.steps && scenario.steps.map((step, stepIndex) => {
                  const stepId = `${scenarioId}-step-${stepIndex}`;
                  const stepStatus = getStepStatus(step);
                  return (
                    <div
                      key={stepIndex}
                      className={`p-2 rounded ${
                        stepStatus === 'failed'
                          ? 'bg-red-50 border-l-4 border-red-500'
                          : stepStatus === 'passed'
                          ? 'bg-green-50 border-l-4 border-green-500'
                          : 'bg-gray-50 border-l-4 border-gray-500'
                      }`}
                    >
                      <div className="flex items-center">
                        <span
                          className={`mr-2 ${
                            stepStatus === 'failed'
                              ? 'text-red-500'
                              : stepStatus === 'passed'
                              ? 'text-green-500'
                              : 'text-gray-500'
                          }`}
                        >
                          {stepStatus === 'passed' ? '✓' : stepStatus === 'failed' ? '✗' : '○'}
                        </span>
                        <span className="text-gray-700">
                          {step.keyword && <span className="font-medium">{step.keyword} </span>}
                          {step.text}
                        </span>
                      </div>
                      {step.errorMessage && (
                        <div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleError(stepId);
                            }}
                            className="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center"
                          >
                            <span className="transform transition-transform duration-200 mr-1" style={{ 
                              transform: expandedErrors[stepId] ? 'rotate(90deg)' : 'rotate(0deg)'
                            }}>
                              ▶
                            </span>
                            Show Error
                          </button>
                          {expandedErrors[stepId] && (
                            <pre className="mt-2 p-2 text-sm text-red-600 bg-red-50 rounded overflow-x-auto">
                              {step.errorMessage}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      });
    };

    return (
      <div className="test-result">
        <div className="summary bg-white rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-lg font-semibold">Test Results</h3>
          <div className="flex justify-between mt-4">
            <div>
              <div className="text-lg font-bold">
                {result.scenarios.passed}/{result.scenarios.total}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Scenarios Passed
              </div>
            </div>
            <div>
              <div className="text-lg font-bold">
                {result.features.passed}/{result.features.total}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Features Passed
              </div>
            </div>
            <div>
              <div className="text-lg font-bold">{result.time || 0}ms</div>
              <div className="text-sm text-gray-600 mt-2">
                Execution Time
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-4">Test Steps</h3>
          {renderScenarios()}
        </div>
      </div>
    );
  };

  const ExecutionLogs = ({ logs }: { logs: string }) => {
    const [expanded, setExpanded] = useState(false);
    
    const downloadLogs = () => {
      const blob = new Blob([logs], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'execution-logs.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    };

    const copyLogs = () => {
      navigator.clipboard.writeText(logs);
    };

    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Execution Logs</h2>
          <div className="flex gap-2">
            <button
              onClick={copyLogs}
              className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
              title="Copy logs"
            >
              Copy
            </button>
            <button
              onClick={downloadLogs}
              className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
              title="Download logs"
            >
              Download
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
            >
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
        {expanded && (
          <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96 whitespace-pre-wrap font-mono">
            {logs}
          </pre>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Karate as a Service</h1>
              <div className="text-sm text-gray-600 mt-2">
                {versions.karate && <span className="mr-4">Karate {versions.karate}</span>}
                {versions.java && <span>Java {versions.java}</span>}
              </div>
            </div>
            <a
              href="https://github.com/your-repo/kaas"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Feature</h2>
                <div className="h-[400px] w-full border border-gray-200 rounded-lg overflow-hidden">
                  <MonacoEditor
                    height="100%"
                    language="gherkin"
                    theme="vs-light"
                    value={feature}
                    onChange={value => setFeature(value || '')}
                    onMount={(editor, monaco) => {
                      setEditorRef(editor);
                      if (!monaco.languages.getLanguages().some(lang => lang.id === 'gherkin')) {
                        monaco.languages.register({ id: 'gherkin' });
                        monaco.languages.setMonarchTokensProvider('gherkin', {
                          tokenizer: {
                            root: [
                              [/^(Feature|Scenario|Given|When|Then|And|But|Background|Examples|Scenario Outline)\b/, 'keyword'],
                              [/@\w+/, 'tag'],
                              [/#.*$/, 'comment'],
                              [/<[^>]+>/, 'variable'],
                              [/"([^"\\]|\\.)*$/, 'string.invalid'],
                              [/'([^'\\]|\\.)*$/, 'string.invalid'],
                              [/"/, 'string', '@string_double'],
                              [/'/, 'string', '@string_single'],
                              [/\d+/, 'number'],
                            ],
                            string_double: [
                              [/[^\\"]+/, 'string'],
                              [/"/, 'string', '@pop'],
                            ],
                            string_single: [
                              [/[^\\']+/, 'string'],
                              [/'/, 'string', '@pop'],
                            ],
                          },
                        });
                      }
                      if (result) {
                        highlightFailedSteps(editor, monaco, result);
                      }
                    }}
                    options={{
                      minimap: { enabled: false },
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      automaticLayout: true,
                      fontSize: 14,
                      renderWhitespace: 'none',
                      folding: true,
                      glyphMargin: true,
                      theme: 'vs-light'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Configuration</h2>
                <div className="h-[400px] w-full border border-gray-200 rounded-lg overflow-hidden">
                  <MonacoEditor
                    height="100%"
                    language="json"
                    theme="vs-light"
                    value={configState}
                    onChange={value => setConfigState(value || '')}
                    options={{
                      minimap: { enabled: false },
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      automaticLayout: true,
                      fontSize: 14,
                      renderWhitespace: 'none',
                      folding: true,
                      theme: 'vs-light'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Results</h2>
                <button
                  onClick={executeFeature}
                  disabled={loading}
                  className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Executing...' : 'Execute'}
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="text-green-800 font-medium">Passed</div>
                      <div className="text-2xl font-bold text-green-900">
                        {result.scenarios.passed}
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="text-red-800 font-medium">Failed</div>
                      <div className="text-2xl font-bold text-red-900">
                        {result.scenarios.failed}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-gray-800 font-medium">Total</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {result.scenarios.total}
                      </div>
                    </div>
                  </div>

                  <TestResultView result={result} />
                </div>
              )}
            </div>
          </div>
        </div>

        {logs && logs.length > 0 && (
          <div className="mt-6">
            <ExecutionLogs logs={logs} />
          </div>
        )}
      </div>
    </main>
  );
}

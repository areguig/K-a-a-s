import type { editor } from 'monaco-editor';
import { KarateResult, KarateStep } from '../types/karate';

export const highlightFailedSteps = (
  editor: editor.IStandaloneCodeEditor,
  monaco: any,
  result: KarateResult
): void => {
  if (!editor || !result) return;

  const model = editor.getModel();
  if (!model) return;

  const decorations: editor.IModelDeltaDecoration[] = [];
  const lines = model.getLinesContent();

  const findStepLine = (stepText: string): number => {
    if (!stepText) return -1;
    return lines.findIndex((line: string) => {
      if (!line) return false;
      const cleanLine = line.trim().toLowerCase();
      const cleanStep = stepText.trim().toLowerCase();
      return cleanLine.includes(cleanStep);
    }) + 1;
  };

  const processStep = (step: KarateStep): void => {
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

import axios from 'axios';
import config from '../app/config';
import { KarateVersions, KarateResult } from '../types/karate';

export const fetchVersions = async (): Promise<KarateVersions> => {
  const response = await fetch(`${config.apiUrl}/karate/versions`);
  return response.json();
};

export const executeFeature = async (
  feature: string,
  configState: string
): Promise<KarateResult> => {
  try {
    const response = await axios.post(`${config.apiUrl}/karate/execute`, {
      feature,
      config: JSON.parse(configState)
    });

    console.log('API Response:', response.data);

    if (!response.data || !response.data.output) {
      throw new Error('Invalid response format from API');
    }

    const output = response.data.output;
    console.log('Output object:', output);

    // Parse scenarios from the feature content
    const scenarioMatches = output.featureContent.match(/Scenario:.*?(?=Scenario:|$)/gs) || [];
    const scenariosList = scenarioMatches.map((scenarioContent: string) => {
      const scenarioName = scenarioContent.match(/Scenario:\s*(.*)/)?.[1] || 'Unnamed Scenario';
      const stepLines = scenarioContent.split('\n')
        .filter((line: string) => /^\s*(Given|When|Then|And|But)\s+/.test(line))
        .map((line: string) => line.trim());

      const scenarioSteps = stepLines.map((stepLine: string) => {
        const [, keyword, text] = stepLine.match(/^\s*(Given|When|Then|And|But)\s+(.+)/) || [];
        const matchingStep = output.steps?.find((step: any) => 
          step.text === text
        );

        return {
          name: stepLine,
          status: matchingStep?.status || 'passed',
          errorMessage: matchingStep?.error
        };
      });

      const hasFailedSteps = scenarioSteps.some(step => 
        step.status === 'failed' || step.status === 'skipped'
      );
      
      return {
        name: scenarioName.trim(),
        steps: scenarioSteps,
        status: hasFailedSteps ? 'failed' : 'passed'
      };
    });

    const result: KarateResult = {
      scenariosList,
      status: output.scenarios.failed > 0 ? 'failed' : 'passed',
      time: output.time,
      features: {
        passed: output.features.passed,
        total: output.features.total
      },
      scenarios: {
        passed: output.scenarios.passed,
        failed: output.scenarios.failed,
        total: output.scenarios.total
      },
      logs: response.data.rawOutput.split('\n')
    };

    console.log('Final result object:', result);
    return result;
  } catch (error) {
    console.error('Error in executeFeature:', error);
    throw error;
  }
};

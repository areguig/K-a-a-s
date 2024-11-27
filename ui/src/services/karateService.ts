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

    const result: KarateResult = {
      scenariosList: output.scenarioResults.map((scenario: any) => ({
        name: scenario.name,
        steps: scenario.steps.map((step: any) => ({
          name: step.name,
          status: step.status,
          errorMessage: step.errorMessage
        })),
        status: scenario.status
      })),
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

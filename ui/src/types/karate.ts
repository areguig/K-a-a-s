export interface KarateVersions {
  karate: string;
  java: string;
}

export interface KarateStep {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  errorMessage?: string;
}

export interface KarateScenario {
  name: string;
  steps: KarateStep[];
  status: 'passed' | 'failed' | 'skipped';
}

export interface KarateResult {
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
  logs?: string[];
  rawOutput?: string;
}

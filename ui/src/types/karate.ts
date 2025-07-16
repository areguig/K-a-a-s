export interface KarateVersions {
  name: string;
  description: string;
  version: {
    version: string;
    gitCommit: string;
    gitBranch: string;
    buildTime: string;
    karateVersion: string;
    javaVersion: string;
    gitDirty: boolean;
    springBootVersion: string;
    fullVersion: string;
  };
  resources: {
    trackedFiles: number;
    tempDirectory: string;
    activeExecutions: number;
  };
  timestamp: number;
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

export interface GenerateRequest {
  name: string;
  httpMethod?: string;
  apiEndpoint?: string;
  headers?: string;
  requestBody?: string;
  expectedResponse?: string;
  verifications?: string;
}

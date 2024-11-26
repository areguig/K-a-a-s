import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export interface KarateConfig {
  env?: Record<string, string>;
  configDir?: string;
  [key: string]: any;
}

export interface KarateExecutionRequest {
  feature: string;
  config?: KarateConfig;
}

interface StepResult {
  line: number;
  keyword: string;
  text: string;
  status: 'passed' | 'failed' | 'skipped';
  logs?: string[];
  error?: string;
  request?: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  response?: {
    status: number;
    headers: Record<string, string>;
    body?: any;
    time?: number;
  };
}

export interface KarateResult {
  scenarios: { total: number; passed: number; failed: number };
  features: { total: number; passed: number; failed: number };
  time: number;
  featureContent: string;
  steps: StepResult[];
}

export interface KarateExecutionResponse {
  success: boolean;
  output: KarateResult;
  rawOutput: string;
}

@Injectable()
export class KarateService {
  private readonly logger = new Logger(KarateService.name);
  private readonly karatePath: string;

  constructor() {
    this.karatePath = path.join(__dirname, '../../lib/karate.jar');
  }

  private async createTempFeatureFile(content: string): Promise<string> {
    try {
      const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'karate-'));
      const featurePath = path.join(tempDir, 'temp.feature');
      await fsPromises.writeFile(featurePath, content);
      this.logger.debug(`Created temporary feature file at: ${featurePath}`);
      return featurePath;
    } catch (error) {
      this.logger.error('Error creating temp feature file:', error);
      throw error;
    }
  }

  private async createTempConfigFile(config: KarateConfig): Promise<string> {
    try {
      const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'karate-config-'));
      const configPath = path.join(tempDir, 'karate-config.js');
      const configContent = `function fn() { return ${JSON.stringify(config)}; }`;
      await fsPromises.writeFile(configPath, configContent);
      this.logger.debug(`Created temporary config file at: ${configPath}`);
      return configPath;
    } catch (error) {
      this.logger.error('Error creating temp config file:', error);
      throw error;
    }
  }

  private parseKarateOutput(output: string, featureContent: string): KarateResult {
    try {
      this.logger.debug('Raw Karate output:', output);

      const result: KarateResult = {
        scenarios: { total: 0, passed: 0, failed: 0 },
        features: { total: 0, passed: 0, failed: 0 },
        time: 0,
        featureContent,
        steps: []
      };

      // Parse scenarios
      const scenarioMatch = output.match(/scenarios:\s*(\d+)\s*\|\s*passed:\s*(\d+)\s*\|\s*failed:\s*(\d+)/i);
      if (scenarioMatch) {
        result.scenarios.total = parseInt(scenarioMatch[1], 10);
        result.scenarios.passed = parseInt(scenarioMatch[2], 10);
        result.scenarios.failed = parseInt(scenarioMatch[3], 10);
      }

      // Parse features
      const featureMatch = output.match(/features:\s*(\d+)\s*\|\s*skipped:\s*(\d+)/i);
      if (featureMatch) {
        result.features.total = parseInt(featureMatch[1], 10);
      }

      // Parse time
      const timeMatch = output.match(/elapsed:\s*([\d.]+)/i);
      if (timeMatch) {
        result.time = parseFloat(timeMatch[1]);
      }

      // Split feature content into lines for reference
      const featureLines = featureContent.split('\n');
      
      // Parse steps and their results
      const lines = output.split('\n');
      let currentStep: StepResult | null = null;
      let currentLogs: string[] = [];
      let currentRequest: any = null;
      let currentResponse: any = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Look for step definitions (Given, When, Then, And)
        const stepMatch = line.match(/^(Given|When|Then|And|But)\s+(.+)/i);
        if (stepMatch) {
          // If we have a previous step, save it
          if (currentStep) {
            if (currentLogs.length > 0) {
              currentStep.logs = currentLogs;
            }
            if (currentRequest) {
              currentStep.request = currentRequest;
            }
            if (currentResponse) {
              currentStep.response = currentResponse;
            }
            result.steps.push(currentStep);
          }

          // Start new step
          currentStep = {
            line: result.steps.length + 1,
            keyword: stepMatch[1],
            text: stepMatch[2],
            status: 'passed', // Default to passed
            logs: []
          };
          currentLogs = [];
          currentRequest = null;
          currentResponse = null;

          // Check if the step is skipped
          if (line.includes('skipped')) {
            currentStep.status = 'skipped';
          }
          continue;
        }

        // Look for step status indicators
        if (line.includes('✓') || line.includes('passed')) {
          if (currentStep) {
            currentStep.status = 'passed';
          }
          continue;
        }

        if (line.includes('×') || line.includes('failed') || line.includes('match failed') || line.includes('error')) {
          if (currentStep) {
            currentStep.status = 'failed';
            if (!currentStep.error) {
              currentStep.error = line;
            }
          }
          continue;
        }

        if (line.includes('-') || line.includes('skipped')) {
          if (currentStep) {
            currentStep.status = 'skipped';
          }
          continue;
        }

        // Look for HTTP request logs
        const requestMatch = line.match(/^>\s*(GET|POST|PUT|DELETE|PATCH)\s+(.+)/);
        if (requestMatch) {
          currentRequest = {
            method: requestMatch[1],
            url: requestMatch[2],
            headers: {}
          };
          continue;
        }

        // Look for HTTP response logs
        const responseMatch = line.match(/^<\s*(\d+)/);
        if (responseMatch) {
          currentResponse = {
            status: parseInt(responseMatch[1], 10),
            headers: {}
          };
          continue;
        }

        // Look for response time
        const responseTimeMatch = line.match(/response time in milliseconds:\s*(\d+)/);
        if (responseTimeMatch && currentResponse) {
          currentResponse.time = parseInt(responseTimeMatch[1], 10);
          continue;
        }

        // Look for headers
        const headerMatch = line.match(/^[><]\s*([^:]+):\s*(.+)/);
        if (headerMatch) {
          if (currentRequest && line.startsWith('>')) {
            currentRequest.headers[headerMatch[1]] = headerMatch[2];
          } else if (currentResponse && line.startsWith('<')) {
            currentResponse.headers[headerMatch[1]] = headerMatch[2];
          }
          continue;
        }

        // Look for JSON response body
        if (line.startsWith('{') || line.startsWith('[')) {
          try {
            const json = JSON.parse(line);
            if (currentResponse) {
              currentResponse.body = json;
            } else if (currentRequest) {
              currentRequest.body = json;
            }
            continue;
          } catch (e) {
            // Not valid JSON, treat as regular log
          }
        }

        // Add as log if not empty
        if (line) {
          currentLogs.push(line);
        }
      }

      // Add the last step if exists
      if (currentStep) {
        if (currentLogs.length > 0) {
          currentStep.logs = currentLogs;
        }
        if (currentRequest) {
          currentStep.request = currentRequest;
        }
        if (currentResponse) {
          currentStep.response = currentResponse;
        }
        result.steps.push(currentStep);
      }

      return result;
    } catch (error) {
      this.logger.error('Error parsing Karate output:', error);
      throw error;
    }
  }

  async execute(request: KarateExecutionRequest): Promise<KarateExecutionResponse> {
    const tempDirs: string[] = [];
    try {
      // Create temporary feature file
      const featurePath = await this.createTempFeatureFile(request.feature);
      const tempDir = path.dirname(featurePath);
      tempDirs.push(tempDir);

      // Create temporary config file if provided
      let configPath: string | undefined;
      if (request.config) {
        configPath = await this.createTempConfigFile(request.config);
        tempDirs.push(path.dirname(configPath));
      }

      try {
        // Build command
        const args = ['-jar', this.karatePath];
        if (configPath) {
          args.push('--configdir', path.dirname(configPath));
        }
        args.push(featurePath);

        // Execute Karate
        const { stdout, stderr } = await execAsync(`java ${args.join(' ')}`);

        if (stderr) {
          this.logger.warn('Karate stderr:', stderr);
        }

        this.logger.debug('Karate stdout:', stdout);
        
        // Parse the output with the feature content
        const result = this.parseKarateOutput(stdout, request.feature);

        return {
          success: result.scenarios.failed === 0,
          output: result,
          rawOutput: stdout
        };

      } catch (error: any) {
        if (error.stdout || error.stderr) {
          const output = error.stdout || error.stderr;
          if (output.includes('there are test failures') || output.includes('scenarios:')) {
            const result = this.parseKarateOutput(output, request.feature);
            return {
              success: false,
              output: result,
              rawOutput: output
            };
          }
        }

        this.logger.error('Error executing Karate feature:', error);
        return {
          success: false,
          output: {
            scenarios: { total: 0, passed: 0, failed: 0 },
            features: { total: 0, passed: 0, failed: 0 },
            time: 0,
            featureContent: request.feature,
            steps: []
          },
          rawOutput: error.stderr || error.stdout || error.message || 'Unknown error'
        };
      }
    } catch (error: any) {
      this.logger.error('Error in execute method:', error);
      return {
        success: false,
        output: {
          scenarios: { total: 0, passed: 0, failed: 0 },
          features: { total: 0, passed: 0, failed: 0 },
          time: 0,
          featureContent: request.feature,
          steps: []
        },
        rawOutput: error.message || 'Unknown error'
      };
    } finally {
      // Cleanup temp directories
      for (const dir of tempDirs) {
        try {
          await fsPromises.rm(dir, { recursive: true });
        } catch (error) {
          this.logger.error(`Error cleaning up temp directory ${dir}:`, error);
        }
      }
    }
  }

  async getVersions(): Promise<{ karate: string; java: string }> {
    try {
      // Get Java version
      const { stdout: javaVersion } = await execAsync('java -version 2>&1');
      const javaMatch = javaVersion.match(/version "([^"]+)"/);

      // Get Karate version by running with --help
      const { stdout: karateHelp, stderr: karateStderr } = await execAsync(`java -jar "${this.karatePath}"`);
      const output = karateHelp || karateStderr;
      
      // Extract version from the first line which typically shows "Karate version X.Y.Z"
      const lines = output.split('\n');
      const versionLine = lines.find(line => line.toLowerCase().includes('karate version'));
      const versionMatch = versionLine?.match(/version\s+([0-9.]+)/i);

      this.logger.debug('Java version output:', javaVersion);
      this.logger.debug('Karate help output:', output);

      return {
        java: javaMatch ? javaMatch[1] : 'unknown',
        karate: versionMatch ? versionMatch[1].trim() : '1.4.0' // Fallback to known version
      };
    } catch (error) {
      this.logger.error('Error getting versions:', error);
      return {
        java: 'unknown',
        karate: '1.4.0' // Fallback to known version since we downloaded 1.4.0
      };
    }
  }
}

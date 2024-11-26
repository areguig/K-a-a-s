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
  threads?: number;
  threadMonitoring?: boolean;
  [key: string]: any;
}

export interface KarateExecutionRequest {
  feature: string;
  config?: KarateConfig;
}

interface ThreadStats {
  virtualThreadCount: number;
  platformThreadCount: number;
  activeThreads: number;
  peakThreadCount: number;
  totalStartedThreadCount: number;
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
    startTime?: number;
    endTime?: number;
  };
  response?: {
    status: number;
    headers: Record<string, string>;
    body?: any;
    time?: number;
  };
  threadInfo?: {
    id: string;
    type: 'virtual' | 'platform';
    startTime: number;
    endTime: number;
  };
}

export interface KarateResult {
  scenarios: { total: number; passed: number; failed: number };
  features: { total: number; passed: number; failed: number };
  time: number;
  featureContent: string;
  steps: StepResult[];
  threadStats?: ThreadStats;
  performanceMetrics?: {
    avgResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    concurrentThreadsMax: number;
    totalThreadsUsed: number;
  };
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
  private readonly threadStatsPath: string;

  constructor() {
    this.karatePath = path.join(__dirname, '../../lib/karate.jar');
    this.threadStatsPath = path.join(os.tmpdir(), 'karate-thread-stats.json');
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

  private async createThreadMonitoringAgent(): Promise<string> {
    const agentContent = `
    public class ThreadMonitoringAgent {
      public static void premain(String args) {
        Thread.startVirtualThread(() -> {
          try {
            while (true) {
              ThreadStats stats = new ThreadStats();
              stats.virtualThreadCount = Thread.getAllStackTraces().keySet()
                .stream().filter(Thread::isVirtual).count();
              stats.platformThreadCount = Thread.getAllStackTraces().keySet()
                .stream().filter(t -> !t.isVirtual()).count();
              stats.activeThreads = Thread.activeCount();
              stats.peakThreadCount = Thread.getAllStackTraces().size();
              stats.totalStartedThreadCount = stats.virtualThreadCount + stats.platformThreadCount;
              
              // Write stats to file
              try (FileWriter writer = new FileWriter("${this.threadStatsPath}")) {
                writer.write(new com.intuit.karate.JsonUtils.toJson(stats));
              }
              Thread.sleep(1000);
            }
          } catch (Exception e) {
            e.printStackTrace();
          }
        });
      }
    }`;

    const agentPath = path.join(os.tmpdir(), 'ThreadMonitoringAgent.java');
    await fsPromises.writeFile(agentPath, agentContent);
    
    // Compile the agent
    await execAsync(`javac -source 21 --enable-preview ${agentPath}`);
    
    // Create JAR file
    const jarPath = path.join(os.tmpdir(), 'thread-monitoring-agent.jar');
    await execAsync(`jar cmf META-INF/MANIFEST.MF ${jarPath} ThreadMonitoringAgent.class`);
    
    return jarPath;
  }

  async execute(request: KarateExecutionRequest): Promise<KarateExecutionResponse> {
    const tempDirs: string[] = [];
    let monitoringAgent: string | undefined;
    
    try {
      const featurePath = await this.createTempFeatureFile(request.feature);
      const tempDir = path.dirname(featurePath);
      tempDirs.push(tempDir);

      let configPath: string | undefined;
      if (request.config) {
        configPath = await this.createTempConfigFile(request.config);
        tempDirs.push(path.dirname(configPath));
      }

      // Create thread monitoring agent if requested
      if (request.config?.threadMonitoring) {
        monitoringAgent = await this.createThreadMonitoringAgent();
      }

      try {
        const baseJvmArgs = (process.env.JAVA_OPTS || '').split(/\s+/).filter(Boolean);
        const additionalJvmArgs = [
          // Thread monitoring
          monitoringAgent ? `-javaagent:${monitoringAgent}` : '',
        
          // Karate-specific optimizations only (removing duplicated JVM options)
          '-Dkarate.env.parallel=false',
          '-Dkarate.timeoutInterval=5000',
          '-Dkarate.http.ssl.allowInsecure=true',
          '-Dkarate.http.connectTimeout=5000',
          '-Dkarate.http.readTimeout=5000',
          // Resource-specific settings for render.com
          '-XX:InitialRAMPercentage=50.0',
          '-XX:MaxRAMPercentage=80.0',
          `-Dkarate.config.dir=${configPath ? path.dirname(configPath) : ''}`,
          `-Dkarate.output.dir=${tempDir}`
        ].filter(Boolean);

        const args = [...baseJvmArgs, ...additionalJvmArgs, '-jar', this.karatePath];
        
        if (request.config?.threads) {
          args.push('--threads', request.config.threads.toString());
        }
        
        if (configPath) {
          args.push('--configdir', path.dirname(configPath));
        }
        
        args.push(featurePath);

        const command = `java ${args.join(' ')}`;
        this.logger.debug(`Executing command: ${command}`);

        try {
          const { stdout, stderr } = await execAsync(command, {
            maxBuffer: 10 * 1024 * 1024,
            timeout: 60000,
            env: {
              ...process.env,
              JAVA_TOOL_OPTIONS: process.env.JAVA_OPTS
            }
          });

          const result = this.parseKarateOutput(stdout, request.feature);
          
          // Check if there were test failures
          const hasFailures = result.scenarios.failed > 0 || result.features.failed > 0;
          
          return {
            success: !hasFailures,
            output: result,
            rawOutput: stderr ? `${stdout}\n${stderr}` : stdout
          };
        } catch (execError: any) {
          const result = this.parseKarateOutput(execError.stdout || '', request.feature);
          return {
            success: false,
            output: result,
            rawOutput: execError.stderr ? `${execError.stdout || ''}\n${execError.stderr}` : (execError.stdout || '')
          };
        }

      } finally {
        await Promise.all([
          ...tempDirs.map(dir => 
            fsPromises.rm(dir, { recursive: true, force: true })
              .catch(err => this.logger.error(`Error cleaning up temp directory ${dir}:`, err))
          ),
          monitoringAgent ? fsPromises.unlink(monitoringAgent).catch(() => {}) : Promise.resolve(),
          fsPromises.unlink(this.threadStatsPath).catch(() => {})
        ]);
      }
    } catch (error) {
      this.logger.error('Error executing Karate:', error);
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

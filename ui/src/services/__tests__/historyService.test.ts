import { HistoryService } from '../historyService';
import { KarateResult } from '../../types/karate';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('HistoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveExecution', () => {
    it('should save execution to localStorage', () => {
      const mockResult: KarateResult = {
        scenarios: {
          passed: 2,
          failed: 1,
          total: 3
        },
        scenariosList: [
          { name: 'Test Scenario 1', steps: [], status: 'passed' },
          { name: 'Test Scenario 2', steps: [], status: 'passed' },
          { name: 'Test Scenario 3', steps: [], status: 'failed' }
        ],
        status: 'failed',
        time: 1500,
        logs: ['log1', 'log2'],
        features: { passed: 0, total: 1 }
      };

      localStorageMock.getItem.mockReturnValue(null);

      const execution = HistoryService.saveExecution(
        'Feature: Test\nScenario: Test',
        '{"logLevel": "debug"}',
        mockResult
      );

      expect(execution.id).toBeDefined();
      expect(execution.timestamp).toBeDefined();
      expect(execution.featureContent).toBe('Feature: Test\nScenario: Test');
      expect(execution.configContent).toBe('{"logLevel": "debug"}');
      expect(execution.resultSummary.passed).toBe(2);
      expect(execution.resultSummary.failed).toBe(1);
      expect(execution.resultSummary.total).toBe(3);
      expect(execution.resultSummary.status).toBe('failed');
      expect(execution.scenarioNames).toEqual(['Test Scenario 1', 'Test Scenario 2', 'Test Scenario 3']);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should extract tags from feature content', () => {
      const mockResult: KarateResult = {
        scenarios: {
          passed: 1,
          failed: 0,
          total: 1
        },
        scenariosList: [{ name: 'Test', steps: [], status: 'passed' }],
        status: 'passed',
        time: 1000,
        features: { passed: 1, total: 1 }
      };

      localStorageMock.getItem.mockReturnValue(null);

      const execution = HistoryService.saveExecution(
        '@smoke @api\nFeature: Test\n@regression\nScenario: Test',
        '{}',
        mockResult
      );

      expect(execution.tags).toEqual(['smoke', 'api', 'regression']);
    });

    it('should limit history to 50 items', () => {
      const existingHistories = Array.from({ length: 50 }, (_, i) => ({
        id: `exec_${i}`,
        timestamp: Date.now() - i * 1000,
        featureContent: `Feature ${i}`,
        configContent: '{}',
        resultSummary: { passed: 1, failed: 0, total: 1, status: 'success' as const },
        scenarioNames: [`Scenario ${i}`],
        tags: []
      }));

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingHistories));

      const mockResult: KarateResult = {
        scenarios: {
          passed: 1,
          failed: 0,
          total: 1
        },
        scenariosList: [{ name: 'New Test', steps: [], status: 'passed' }],
        status: 'passed',
        time: 1000,
        features: { passed: 1, total: 1 }
      };

      HistoryService.saveExecution('Feature: New', '{}', mockResult);

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(50);
      expect(savedData[0].featureContent).toBe('Feature: New');
    });
  });

  describe('getHistories', () => {
    it('should return empty array when no data exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const histories = HistoryService.getHistories();
      
      expect(histories).toEqual([]);
    });

    it('should return parsed histories from localStorage', () => {
      const mockHistories = [
        {
          id: 'exec_1',
          timestamp: Date.now(),
          featureContent: 'Feature: Test',
          configContent: '{}',
          resultSummary: { passed: 1, failed: 0, total: 1, status: 'success' },
          scenarioNames: ['Test'],
          tags: []
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistories));
      
      const histories = HistoryService.getHistories();
      
      expect(histories).toEqual(mockHistories);
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const histories = HistoryService.getHistories();
      
      expect(histories).toEqual([]);
    });
  });

  describe('searchHistories', () => {
    const mockHistories = [
      {
        id: 'exec_1',
        timestamp: Date.now(),
        featureContent: 'Feature: Login Tests\nScenario: Successful login',
        configContent: '{}',
        resultSummary: { passed: 1, failed: 0, total: 1, status: 'success' as const },
        scenarioNames: ['Successful login'],
        tags: ['smoke', 'authentication']
      },
      {
        id: 'exec_2',
        timestamp: Date.now() - 1000,
        featureContent: 'Feature: API Tests\nScenario: Get user data',
        configContent: '{}',
        resultSummary: { passed: 0, failed: 1, total: 1, status: 'failed' as const },
        scenarioNames: ['Get user data'],
        tags: ['api', 'regression']
      }
    ];

    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistories));
    });

    it('should filter by search term', () => {
      const results = HistoryService.searchHistories({ searchTerm: 'login' });
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('exec_1');
    });

    it('should filter by status', () => {
      const results = HistoryService.searchHistories({ status: 'failed' });
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('exec_2');
    });

    it('should filter by tags', () => {
      const results = HistoryService.searchHistories({ tags: ['api'] });
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('exec_2');
    });

    it('should return all when no filters applied', () => {
      const results = HistoryService.searchHistories({});
      
      expect(results).toHaveLength(2);
    });
  });

  describe('deleteExecution', () => {
    it('should remove execution by id', () => {
      const mockHistories = [
        { id: 'exec_1', featureContent: 'Feature 1' },
        { id: 'exec_2', featureContent: 'Feature 2' }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistories));

      HistoryService.deleteExecution('exec_1');

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe('exec_2');
    });
  });

  describe('clearHistory', () => {
    it('should remove all history from localStorage', () => {
      HistoryService.clearHistory();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kaas-execution-history');
    });
  });

  describe('exportHistory', () => {
    it('should return JSON string of all histories', () => {
      const mockHistories = [{ id: 'exec_1', featureContent: 'Feature 1' }];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistories));

      const exported = HistoryService.exportHistory();

      expect(exported).toBe(JSON.stringify(mockHistories, null, 2));
    });
  });

  describe('importHistory', () => {
    it('should import valid history data', () => {
      const validData = JSON.stringify([
        {
          id: 'exec_1',
          timestamp: Date.now(),
          featureContent: 'Feature: Test',
          configContent: '{}',
          resultSummary: { passed: 1, failed: 0, total: 1, status: 'success' },
          scenarioNames: ['Test'],
          tags: []
        }
      ]);

      const result = HistoryService.importHistory(validData);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should reject invalid JSON', () => {
      const result = HistoryService.importHistory('invalid json');
      
      expect(result).toBe(false);
    });

    it('should reject non-array data', () => {
      const result = HistoryService.importHistory('{"not": "array"}');
      
      expect(result).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics', () => {
      const mockHistories = [
        {
          id: 'exec_1',
          timestamp: Date.now(),
          featureContent: 'Feature 1',
          configContent: '{}',
          resultSummary: { passed: 2, failed: 0, total: 2, status: 'success' as const, executionTime: 1000 },
          scenarioNames: ['Test 1', 'Test 2'],
          tags: []
        },
        {
          id: 'exec_2',
          timestamp: Date.now() - 1000,
          featureContent: 'Feature 2',
          configContent: '{}',
          resultSummary: { passed: 1, failed: 1, total: 2, status: 'failed' as const, executionTime: 2000 },
          scenarioNames: ['Test 3', 'Test 4'],
          tags: []
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistories));

      const stats = HistoryService.getStatistics();

      expect(stats.totalExecutions).toBe(2);
      expect(stats.successRate).toBe(50);
      expect(stats.averageExecutionTime).toBe(1500);
      expect(stats.totalTests).toBe(4);
    });

    it('should handle empty history', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const stats = HistoryService.getStatistics();

      expect(stats.totalExecutions).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.averageExecutionTime).toBe(0);
      expect(stats.totalTests).toBe(0);
    });
  });
});
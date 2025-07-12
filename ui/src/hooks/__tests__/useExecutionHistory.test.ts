import { renderHook, act } from '@testing-library/react';
import { useExecutionHistory } from '../useExecutionHistory';
import { HistoryService } from '../../services/historyService';
import { KarateResult } from '../../types/karate';

// Mock the HistoryService
jest.mock('../../services/historyService');
const mockHistoryService = HistoryService as jest.Mocked<typeof HistoryService>;

const mockExecutions = [
  {
    id: 'exec_1',
    timestamp: Date.now() - 3600000,
    featureContent: 'Feature: Test 1',
    configContent: '{}',
    resultSummary: {
      passed: 1,
      failed: 0,
      total: 1,
      executionTime: 1000,
      status: 'success' as const
    },
    scenarioNames: ['Test 1'],
    tags: ['smoke']
  },
  {
    id: 'exec_2',
    timestamp: Date.now() - 7200000,
    featureContent: 'Feature: Test 2',
    configContent: '{}',
    resultSummary: {
      passed: 0,
      failed: 1,
      total: 1,
      executionTime: 2000,
      status: 'failed' as const
    },
    scenarioNames: ['Test 2'],
    tags: ['api']
  }
];

describe('useExecutionHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHistoryService.getHistories.mockReturnValue(mockExecutions);
    mockHistoryService.searchHistories.mockReturnValue(mockExecutions);
    mockHistoryService.getAllTags.mockReturnValue(['smoke', 'api']);
    mockHistoryService.getStatistics.mockReturnValue({
      totalExecutions: 2,
      successRate: 50,
      averageExecutionTime: 1500,
      totalTests: 2
    });
  });

  it('should initialize and load histories', async () => {
    const { result } = renderHook(() => useExecutionHistory());

    // Wait for loading to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.histories).toEqual(mockExecutions);
    expect(mockHistoryService.getHistories).toHaveBeenCalled();
  });

  it('should save execution to history', async () => {
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

    const newExecution = {
      id: 'exec_new',
      timestamp: Date.now(),
      featureContent: 'Feature: New',
      configContent: '{}',
      resultSummary: {
        passed: 1,
        failed: 0,
        total: 1,
        executionTime: 1000,
        status: 'success' as const
      },
      scenarioNames: ['Test'],
      tags: []
    };

    mockHistoryService.saveExecution.mockReturnValue(newExecution);

    const { result } = renderHook(() => useExecutionHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      const execution = result.current.saveExecution('Feature: New', '{}', mockResult);
      expect(execution).toEqual(newExecution);
    });

    expect(mockHistoryService.saveExecution).toHaveBeenCalledWith('Feature: New', '{}', mockResult);
    expect(result.current.histories[0]).toEqual(newExecution);
  });

  it('should delete execution from history', async () => {
    const { result } = renderHook(() => useExecutionHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.deleteExecution('exec_1');
    });

    expect(mockHistoryService.deleteExecution).toHaveBeenCalledWith('exec_1');
    expect(result.current.histories).not.toContain(
      expect.objectContaining({ id: 'exec_1' })
    );
  });

  it('should clear all history', async () => {
    const { result } = renderHook(() => useExecutionHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.clearHistory();
    });

    expect(mockHistoryService.clearHistory).toHaveBeenCalled();
    expect(result.current.histories).toEqual([]);
  });

  it('should update search filters', async () => {
    const { result } = renderHook(() => useExecutionHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.updateFilters({ searchTerm: 'test', status: 'success' });
    });

    expect(result.current.searchFilters.searchTerm).toBe('test');
    expect(result.current.searchFilters.status).toBe('success');
    expect(result.current.currentPage).toBe(1); // Should reset to first page
  });

  it('should handle pagination', async () => {
    const { result } = renderHook(() => useExecutionHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.setCurrentPage(2);
    });

    expect(result.current.currentPage).toBe(2);
  });

  it('should provide filtered histories', async () => {
    const filteredExecutions = [mockExecutions[0]];
    mockHistoryService.searchHistories.mockReturnValue(filteredExecutions);

    const { result } = renderHook(() => useExecutionHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.updateFilters({ status: 'success' });
    });

    expect(result.current.filteredHistories).toEqual(filteredExecutions);
    expect(mockHistoryService.searchHistories).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success' })
    );
  });

  it('should provide paginated data', async () => {
    const { result } = renderHook(() => useExecutionHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const paginatedData = result.current.paginatedData;

    expect(paginatedData.histories).toEqual(mockExecutions);
    expect(paginatedData.totalCount).toBe(2);
    expect(paginatedData.totalPages).toBe(1);
    expect(paginatedData.hasNextPage).toBe(false);
    expect(paginatedData.hasPrevPage).toBe(false);
  });

  it('should export history', async () => {
    const exportData = JSON.stringify(mockExecutions);
    mockHistoryService.exportHistory.mockReturnValue(exportData);

    const { result } = renderHook(() => useExecutionHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const exported = result.current.exportHistory();

    expect(exported).toBe(exportData);
    expect(mockHistoryService.exportHistory).toHaveBeenCalled();
  });

  it('should import history and reload', async () => {
    mockHistoryService.importHistory.mockReturnValue(true);

    const { result } = renderHook(() => useExecutionHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    let importResult;
    act(() => {
      importResult = result.current.importHistory('{"data": "test"}');
    });

    expect(importResult).toBe(true);
    expect(mockHistoryService.importHistory).toHaveBeenCalledWith('{"data": "test"}');
    expect(mockHistoryService.getHistories).toHaveBeenCalledTimes(2); // Once on mount, once after import
  });

  it('should get execution by id', async () => {
    mockHistoryService.getExecutionById.mockReturnValue(mockExecutions[0]);

    const { result } = renderHook(() => useExecutionHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const execution = result.current.getExecutionById('exec_1');

    expect(execution).toEqual(mockExecutions[0]);
    expect(mockHistoryService.getExecutionById).toHaveBeenCalledWith('exec_1');
  });

  it('should provide statistics and tags', async () => {
    const { result } = renderHook(() => useExecutionHistory());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.statistics).toEqual({
      totalExecutions: 2,
      successRate: 50,
      averageExecutionTime: 1500,
      totalTests: 2
    });

    expect(result.current.allTags).toEqual(['smoke', 'api']);
  });
});
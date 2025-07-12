import { useState, useEffect, useCallback } from 'react';
import { ExecutionHistory, HistorySearchFilters, HistoryState } from '../types/history';
import { HistoryService } from '../services/historyService';
import { KarateResult } from '../types/karate';

const initialFilters: HistorySearchFilters = {
  searchTerm: '',
  status: 'all',
  tags: []
};

const ITEMS_PER_PAGE = 10;

export const useExecutionHistory = () => {
  const [state, setState] = useState<HistoryState>({
    histories: [],
    isLoading: true,
    searchFilters: initialFilters,
    currentPage: 1,
    itemsPerPage: ITEMS_PER_PAGE
  });

  const loadHistories = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const histories = HistoryService.getHistories();
      setState(prev => ({
        ...prev,
        histories,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading histories:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Load histories on mount
  useEffect(() => {
    loadHistories();
  }, [loadHistories]);

  const saveExecution = useCallback((
    featureContent: string,
    configContent: string,
    result: KarateResult
  ): ExecutionHistory => {
    const execution = HistoryService.saveExecution(featureContent, configContent, result);
    
    // Update state with new execution
    setState(prev => ({
      ...prev,
      histories: [execution, ...prev.histories.slice(0, 49)] // Keep max 50
    }));
    
    return execution;
  }, []);

  const deleteExecution = useCallback((id: string) => {
    HistoryService.deleteExecution(id);
    setState(prev => ({
      ...prev,
      histories: prev.histories.filter(h => h.id !== id)
    }));
  }, []);

  const clearHistory = useCallback(() => {
    HistoryService.clearHistory();
    setState(prev => ({
      ...prev,
      histories: []
    }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<HistorySearchFilters>) => {
    setState(prev => ({
      ...prev,
      searchFilters: { ...prev.searchFilters, ...newFilters },
      currentPage: 1 // Reset to first page when filters change
    }));
  }, []);

  const setCurrentPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      currentPage: page
    }));
  }, []);

  const getFilteredHistories = useCallback(() => {
    return HistoryService.searchHistories(state.searchFilters);
  }, [state.searchFilters]);

  const getPaginatedHistories = useCallback(() => {
    const filtered = getFilteredHistories();
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    
    return {
      histories: filtered.slice(startIndex, endIndex),
      totalCount: filtered.length,
      totalPages: Math.ceil(filtered.length / state.itemsPerPage),
      hasNextPage: endIndex < filtered.length,
      hasPrevPage: state.currentPage > 1
    };
  }, [getFilteredHistories, state.currentPage, state.itemsPerPage]);

  const exportHistory = useCallback(() => {
    return HistoryService.exportHistory();
  }, []);

  const importHistory = useCallback((jsonData: string): boolean => {
    const success = HistoryService.importHistory(jsonData);
    if (success) {
      loadHistories(); // Reload after import
    }
    return success;
  }, [loadHistories]);

  const getAllTags = useCallback(() => {
    return HistoryService.getAllTags();
  }, []);

  const getStatistics = useCallback(() => {
    return HistoryService.getStatistics();
  }, []);

  const getExecutionById = useCallback((id: string): ExecutionHistory | null => {
    return HistoryService.getExecutionById(id);
  }, []);

  return {
    // State
    histories: state.histories,
    isLoading: state.isLoading,
    searchFilters: state.searchFilters,
    currentPage: state.currentPage,
    itemsPerPage: state.itemsPerPage,
    
    // Computed values
    filteredHistories: getFilteredHistories(),
    paginatedData: getPaginatedHistories(),
    allTags: getAllTags(),
    statistics: getStatistics(),
    
    // Actions
    saveExecution,
    deleteExecution,
    clearHistory,
    updateFilters,
    setCurrentPage,
    loadHistories,
    exportHistory,
    importHistory,
    getExecutionById
  };
};
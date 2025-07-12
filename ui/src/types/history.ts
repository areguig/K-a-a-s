export interface ExecutionHistory {
  id: string;
  timestamp: number;
  featureContent: string;
  configContent: string;
  resultSummary: {
    passed: number;
    failed: number;
    total: number;
    executionTime?: number;
    status: 'success' | 'failed' | 'error';
  };
  scenarioNames: string[];
  tags: string[];
}

export interface HistorySearchFilters {
  searchTerm?: string;
  status?: 'success' | 'failed' | 'error' | 'all';
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
}

export interface HistoryState {
  histories: ExecutionHistory[];
  isLoading: boolean;
  searchFilters: HistorySearchFilters;
  currentPage: number;
  itemsPerPage: number;
}
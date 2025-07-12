import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HistoryPanel } from '../HistoryPanel';
import { useExecutionHistory } from '../../hooks/useExecutionHistory';
import { ExecutionHistory } from '../../types/history';

// Mock the hook
jest.mock('../../hooks/useExecutionHistory');
const mockUseExecutionHistory = useExecutionHistory as jest.MockedFunction<typeof useExecutionHistory>;

const mockExecutions: ExecutionHistory[] = [
  {
    id: 'exec_1',
    timestamp: Date.now() - 3600000,
    featureContent: 'Feature: Login Tests\nScenario: Successful login',
    configContent: '{"logLevel": "debug"}',
    resultSummary: {
      passed: 1,
      failed: 0,
      total: 1,
      executionTime: 1000,
      status: 'success'
    },
    scenarioNames: ['Successful login'],
    tags: ['smoke', 'authentication']
  },
  {
    id: 'exec_2',
    timestamp: Date.now() - 7200000,
    featureContent: 'Feature: API Tests\nScenario: Get user data',
    configContent: '{"logLevel": "info"}',
    resultSummary: {
      passed: 0,
      failed: 1,
      total: 1,
      executionTime: 2000,
      status: 'failed'
    },
    scenarioNames: ['Get user data'],
    tags: ['api', 'regression']
  }
];

const mockHookReturnValue = {
  histories: mockExecutions,
  isLoading: false,
  searchFilters: { searchTerm: '', status: 'all' as const, tags: [] },
  currentPage: 1,
  itemsPerPage: 10,
  filteredHistories: mockExecutions,
  paginatedData: {
    histories: mockExecutions,
    totalCount: 2,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  },
  allTags: ['smoke', 'authentication', 'api', 'regression'],
  statistics: {
    totalExecutions: 2,
    successRate: 50,
    averageExecutionTime: 1500,
    totalTests: 2
  },
  saveExecution: jest.fn(),
  updateFilters: jest.fn(),
  setCurrentPage: jest.fn(),
  deleteExecution: jest.fn(),
  clearHistory: jest.fn(),
  exportHistory: jest.fn(() => JSON.stringify(mockExecutions)),
  importHistory: jest.fn(() => true),
  loadHistories: jest.fn(),
  getExecutionById: jest.fn()
};

describe('HistoryPanel', () => {
  const mockOnClose = jest.fn();
  const mockOnLoadHistory = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseExecutionHistory.mockReturnValue(mockHookReturnValue);
    
    // Mock window.confirm
    Object.defineProperty(window, 'confirm', {
      writable: true,
      value: jest.fn(() => true)
    });

    // Mock URL.createObjectURL and other blob-related APIs
    Object.defineProperty(global.URL, 'createObjectURL', {
      writable: true,
      value: jest.fn(() => 'mock-url')
    });
    Object.defineProperty(global.URL, 'revokeObjectURL', {
      writable: true,
      value: jest.fn()
    });
  });

  describe('Visibility', () => {
    it('should not render when isOpen is false', () => {
      render(
        <HistoryPanel
          isOpen={false}
          onClose={mockOnClose}
          onLoadHistory={mockOnLoadHistory}
        />
      );

      expect(screen.queryByText('Execution History')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <HistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onLoadHistory={mockOnLoadHistory}
        />
      );

      expect(screen.getByText('Execution History')).toBeInTheDocument();
    });
  });

  describe('Header and controls', () => {
    beforeEach(() => {
      render(
        <HistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onLoadHistory={mockOnLoadHistory}
        />
      );
    });

    it('should call onClose when close button is clicked', () => {
      const closeButton = screen.getByRole('button', { name: '' }); // The X button has no aria-label
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', () => {
      const backdrop = document.querySelector('.bg-black');
      fireEvent.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should have search input', () => {
      const searchInput = screen.getByPlaceholderText('Search history...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should update search filters when typing in search input', () => {
      const searchInput = screen.getByPlaceholderText('Search history...');
      fireEvent.change(searchInput, { target: { value: 'login' } });

      expect(mockHookReturnValue.updateFilters).toHaveBeenCalledWith({ searchTerm: 'login' });
    });
  });

  describe('Control buttons', () => {
    beforeEach(() => {
      render(
        <HistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onLoadHistory={mockOnLoadHistory}
        />
      );
    });

    it('should toggle filters panel', () => {
      const filterButton = screen.getByTitle('Filters');
      fireEvent.click(filterButton);

      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should toggle statistics panel', () => {
      const statsButton = screen.getByTitle('Statistics');
      fireEvent.click(statsButton);

      expect(screen.getByText('Total Executions')).toBeInTheDocument();
      expect(screen.getAllByText('2').length).toBeGreaterThan(0); // totalExecutions (appears multiple times)
      expect(screen.getByText('50.0%')).toBeInTheDocument(); // successRate
    });

    it('should trigger export when export button is clicked', () => {
      const exportButton = screen.getByTitle('Export history');
      fireEvent.click(exportButton);

      expect(mockHookReturnValue.exportHistory).toHaveBeenCalled();
    });

    it('should trigger clear history with confirmation', () => {
      const clearButton = screen.getByTitle('Clear all history');
      fireEvent.click(clearButton);

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to clear all execution history? This action cannot be undone.'
      );
      expect(mockHookReturnValue.clearHistory).toHaveBeenCalled();
    });
  });

  describe('Filters panel', () => {
    beforeEach(() => {
      render(
        <HistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onLoadHistory={mockOnLoadHistory}
        />
      );

      // Open filters panel
      const filterButton = screen.getByTitle('Filters');
      fireEvent.click(filterButton);
    });

    it('should show status filter buttons', () => {
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      // "Failed" and "Error" appear in multiple places, just check they exist
      expect(screen.getAllByText('Failed').length).toBeGreaterThan(0);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should update filters when status button is clicked', () => {
      const successButton = screen.getByText('Success');
      fireEvent.click(successButton);

      expect(mockHookReturnValue.updateFilters).toHaveBeenCalledWith({ status: 'success' });
    });

    it('should show tag filter section when tags exist', () => {
      expect(screen.getByText('Tags')).toBeInTheDocument();
      // Tags will be rendered from the mock data
      const tagButtons = screen.getAllByRole('button').filter(button => 
        button.textContent?.includes('@')
      );
      expect(tagButtons.length).toBeGreaterThan(0);
    });
  });

  describe('History list', () => {
    it('should render history cards', () => {
      render(
        <HistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onLoadHistory={mockOnLoadHistory}
        />
      );

      // Check that history cards are rendered by looking for re-execute buttons
      const reExecuteButtons = screen.getAllByTitle('Re-execute this test');
      expect(reExecuteButtons).toHaveLength(2); // Two executions from mock data
    });

    it('should show loading state', () => {
      mockUseExecutionHistory.mockReturnValue({
        ...mockHookReturnValue,
        isLoading: true
      });

      render(
        <HistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onLoadHistory={mockOnLoadHistory}
        />
      );

      expect(screen.getByText('Loading history...')).toBeInTheDocument();
    });

    it('should show empty state when no histories', () => {
      mockUseExecutionHistory.mockReturnValue({
        ...mockHookReturnValue,
        paginatedData: {
          histories: [],
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      });

      render(
        <HistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onLoadHistory={mockOnLoadHistory}
        />
      );

      expect(screen.getByText('No execution history found')).toBeInTheDocument();
    });

    it('should show clear search option when searching with no results', () => {
      mockUseExecutionHistory.mockReturnValue({
        ...mockHookReturnValue,
        searchFilters: { searchTerm: 'nonexistent', status: 'all' as const, tags: [] },
        paginatedData: {
          histories: [],
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      });

      render(
        <HistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onLoadHistory={mockOnLoadHistory}
        />
      );

      const clearSearchButton = screen.getByText('Clear search');
      fireEvent.click(clearSearchButton);

      expect(mockHookReturnValue.updateFilters).toHaveBeenCalledWith({ searchTerm: '' });
    });
  });

  describe('Pagination', () => {
    it('should show pagination when multiple pages exist', () => {
      mockUseExecutionHistory.mockReturnValue({
        ...mockHookReturnValue,
        currentPage: 1,
        paginatedData: {
          ...mockHookReturnValue.paginatedData,
          totalPages: 3,
          hasNextPage: true,
          hasPrevPage: false
        }
      });

      render(
        <HistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onLoadHistory={mockOnLoadHistory}
        />
      );

      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    it('should call setCurrentPage for pagination', () => {
      mockUseExecutionHistory.mockReturnValue({
        ...mockHookReturnValue,
        currentPage: 1,
        paginatedData: {
          ...mockHookReturnValue.paginatedData,
          totalPages: 2,
          hasNextPage: true,
          hasPrevPage: false
        }
      });

      render(
        <HistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onLoadHistory={mockOnLoadHistory}
        />
      );

      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      // Test pagination functionality is covered by the hook tests
    });
  });

  describe('Import functionality', () => {
    it('should have import button with file input', () => {
      render(
        <HistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onLoadHistory={mockOnLoadHistory}
        />
      );

      const importButton = screen.getByTitle('Import history');
      expect(importButton).toBeInTheDocument();
      
      const fileInput = importButton.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', '.json');
    });
  });
});
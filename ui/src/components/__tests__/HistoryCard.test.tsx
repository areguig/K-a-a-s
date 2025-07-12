import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryCard } from '../HistoryCard';
import { ExecutionHistory } from '../../types/history';

const mockExecution: ExecutionHistory = {
  id: 'exec_123',
  timestamp: Date.now() - 3600000, // 1 hour ago
  featureContent: 'Feature: Sample API Tests\n\nScenario: Get user data\n  Given path \'/users/1\'\n  When method GET\n  Then status 200',
  configContent: '{"logLevel": "debug"}',
  resultSummary: {
    passed: 2,
    failed: 1,
    total: 3,
    executionTime: 1500,
    status: 'failed'
  },
  scenarioNames: ['Get user data', 'Create user', 'Delete user'],
  tags: ['api', 'smoke']
};

const mockSuccessExecution: ExecutionHistory = {
  ...mockExecution,
  id: 'exec_456',
  resultSummary: {
    passed: 3,
    failed: 0,
    total: 3,
    executionTime: 1200,
    status: 'success'
  }
};

describe('HistoryCard', () => {
  const mockOnReExecute = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Default (detailed) view', () => {
    it('should render execution details correctly', () => {
      render(
        <HistoryCard
          execution={mockExecution}
          onReExecute={mockOnReExecute}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Sample API Tests')).toBeInTheDocument();
      expect(screen.getByText('failed')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // passed count
      expect(screen.getByText('1')).toBeInTheDocument(); // failed count
      expect(screen.getByText('3')).toBeInTheDocument(); // total count
      expect(screen.getByText('Execution time: 1.5s')).toBeInTheDocument();
      expect(screen.getByText('1h ago')).toBeInTheDocument();
    });

    it('should show scenario names', () => {
      render(
        <HistoryCard
          execution={mockExecution}
          onReExecute={mockOnReExecute}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('• Get user data')).toBeInTheDocument();
      expect(screen.getByText('• Create user')).toBeInTheDocument();
      expect(screen.getByText('• Delete user')).toBeInTheDocument();
    });

    it('should show tags', () => {
      render(
        <HistoryCard
          execution={mockExecution}
          onReExecute={mockOnReExecute}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('@api')).toBeInTheDocument();
      expect(screen.getByText('@smoke')).toBeInTheDocument();
    });

    it('should show success status correctly', () => {
      render(
        <HistoryCard
          execution={mockSuccessExecution}
          onReExecute={mockOnReExecute}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('success')).toBeInTheDocument();
      const statusBadge = screen.getByText('success');
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should call onReExecute when re-execute button is clicked', () => {
      render(
        <HistoryCard
          execution={mockExecution}
          onReExecute={mockOnReExecute}
          onDelete={mockOnDelete}
        />
      );

      const reExecuteButton = screen.getByTitle('Re-execute this test');
      fireEvent.click(reExecuteButton);

      expect(mockOnReExecute).toHaveBeenCalledWith(mockExecution);
    });

    it('should call onDelete when delete button is clicked', () => {
      render(
        <HistoryCard
          execution={mockExecution}
          onReExecute={mockOnReExecute}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByTitle('Delete from history');
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith('exec_123');
    });

    it('should limit scenario display to 3 items', () => {
      const executionWithManyScenarios = {
        ...mockExecution,
        scenarioNames: ['Scenario 1', 'Scenario 2', 'Scenario 3', 'Scenario 4', 'Scenario 5']
      };

      render(
        <HistoryCard
          execution={executionWithManyScenarios}
          onReExecute={mockOnReExecute}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('• Scenario 1')).toBeInTheDocument();
      expect(screen.getByText('• Scenario 2')).toBeInTheDocument();
      expect(screen.getByText('• Scenario 3')).toBeInTheDocument();
      expect(screen.getByText('+2 more...')).toBeInTheDocument();
      expect(screen.queryByText('• Scenario 4')).not.toBeInTheDocument();
    });

    it('should limit tags display to 3 items', () => {
      const executionWithManyTags = {
        ...mockExecution,
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
      };

      render(
        <HistoryCard
          execution={executionWithManyTags}
          onReExecute={mockOnReExecute}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('@tag1')).toBeInTheDocument();
      expect(screen.getByText('@tag2')).toBeInTheDocument();
      expect(screen.getByText('@tag3')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
      expect(screen.queryByText('@tag4')).not.toBeInTheDocument();
    });
  });

  describe('Compact view', () => {
    it('should render compact view correctly', () => {
      render(
        <HistoryCard
          execution={mockExecution}
          onReExecute={mockOnReExecute}
          onDelete={mockOnDelete}
          isCompact={true}
        />
      );

      expect(screen.getByText('Sample API Tests')).toBeInTheDocument();
      expect(screen.getByText('1h ago')).toBeInTheDocument();
      
      // Detailed info should not be visible in compact mode
      expect(screen.queryByText('failed')).not.toBeInTheDocument();
      expect(screen.queryByText('Execution time: 1.5s')).not.toBeInTheDocument();
    });

    it('should have action buttons in compact view', () => {
      render(
        <HistoryCard
          execution={mockExecution}
          onReExecute={mockOnReExecute}
          onDelete={mockOnDelete}
          isCompact={true}
        />
      );

      const reExecuteButton = screen.getByTitle('Re-execute');
      const deleteButton = screen.getByTitle('Delete');

      expect(reExecuteButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();

      fireEvent.click(reExecuteButton);
      expect(mockOnReExecute).toHaveBeenCalledWith(mockExecution);

      fireEvent.click(deleteButton);
      expect(mockOnDelete).toHaveBeenCalledWith('exec_123');
    });
  });

  describe('Time formatting', () => {
    it('should format recent times correctly', () => {
      const recentExecution = {
        ...mockExecution,
        timestamp: Date.now() - 30 * 60 * 1000 // 30 minutes ago
      };

      render(
        <HistoryCard
          execution={recentExecution}
          onReExecute={mockOnReExecute}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('30m ago')).toBeInTheDocument();
    });

    it('should format day-old times correctly', () => {
      const oldExecution = {
        ...mockExecution,
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 // 2 days ago
      };

      render(
        <HistoryCard
          execution={oldExecution}
          onReExecute={mockOnReExecute}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('2d ago')).toBeInTheDocument();
    });
  });

  describe('Feature title extraction', () => {
    it('should extract feature title from content', () => {
      const executionWithTitle = {
        ...mockExecution,
        featureContent: 'Feature: User Management API\n\nScenario: Test scenario'
      };

      render(
        <HistoryCard
          execution={executionWithTitle}
          onReExecute={mockOnReExecute}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('User Management API')).toBeInTheDocument();
    });

    it('should show default title when no feature line found', () => {
      const executionWithoutTitle = {
        ...mockExecution,
        featureContent: 'Scenario: Test scenario without feature line'
      };

      render(
        <HistoryCard
          execution={executionWithoutTitle}
          onReExecute={mockOnReExecute}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Untitled Feature')).toBeInTheDocument();
    });
  });

  describe('Execution time formatting', () => {
    it('should format milliseconds correctly', () => {
      const executionWithMs = {
        ...mockExecution,
        resultSummary: {
          ...mockExecution.resultSummary,
          executionTime: 500
        }
      };

      render(
        <HistoryCard
          execution={executionWithMs}
          onReExecute={mockOnReExecute}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Execution time: 500ms')).toBeInTheDocument();
    });

    it('should not show execution time when not available', () => {
      const executionWithoutTime = {
        ...mockExecution,
        resultSummary: {
          ...mockExecution.resultSummary,
          executionTime: undefined
        }
      };

      render(
        <HistoryCard
          execution={executionWithoutTime}
          onReExecute={mockOnReExecute}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText(/Execution time:/)).not.toBeInTheDocument();
    });
  });
});
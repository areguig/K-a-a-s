import { ExecutionHistory, HistorySearchFilters } from '../types/history';
import { KarateResult } from '../types/karate';

const STORAGE_KEY = 'kaas-execution-history';
const MAX_HISTORY_ITEMS = 50;

export class HistoryService {
  /**
   * Save a new execution to history
   */
  static saveExecution(
    featureContent: string, 
    configContent: string, 
    result: KarateResult
  ): ExecutionHistory {
    const execution: ExecutionHistory = {
      id: this.generateId(),
      timestamp: Date.now(),
      featureContent,
      configContent,
      resultSummary: {
        passed: result.scenarios?.passed || 0,
        failed: result.scenarios?.failed || 0,
        total: result.scenarios?.total || result.scenariosList?.length || 0,
        executionTime: result.time,
        status: (result.scenarios?.failed || 0) > 0 ? 'failed' : 'success'
      },
      scenarioNames: result.scenariosList?.map(s => s.name) || [],
      tags: this.extractTags(featureContent)
    };

    const histories = this.getHistories();
    histories.unshift(execution); // Add to beginning
    
    // Keep only the latest MAX_HISTORY_ITEMS
    const trimmedHistories = histories.slice(0, MAX_HISTORY_ITEMS);
    this.saveHistories(trimmedHistories);
    
    return execution;
  }

  /**
   * Get all execution histories
   */
  static getHistories(): ExecutionHistory[] {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        return [];
      }
      
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error loading execution history:', error);
      return [];
    }
  }

  /**
   * Search and filter histories
   */
  static searchHistories(filters: HistorySearchFilters): ExecutionHistory[] {
    const histories = this.getHistories();
    
    return histories.filter(history => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesFeature = history.featureContent.toLowerCase().includes(searchLower);
        const matchesScenario = history.scenarioNames.some(name => 
          name.toLowerCase().includes(searchLower)
        );
        const matchesTags = history.tags.some(tag => 
          tag.toLowerCase().includes(searchLower)
        );
        
        if (!matchesFeature && !matchesScenario && !matchesTags) {
          return false;
        }
      }
      
      // Status filter
      if (filters.status && filters.status !== 'all') {
        if (history.resultSummary.status !== filters.status) {
          return false;
        }
      }
      
      // Date range filter
      if (filters.dateFrom) {
        if (history.timestamp < filters.dateFrom.getTime()) {
          return false;
        }
      }
      
      if (filters.dateTo) {
        if (history.timestamp > filters.dateTo.getTime()) {
          return false;
        }
      }
      
      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(filterTag =>
          history.tags.includes(filterTag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Delete a specific execution from history
   */
  static deleteExecution(id: string): void {
    const histories = this.getHistories();
    const filtered = histories.filter(h => h.id !== id);
    this.saveHistories(filtered);
  }

  /**
   * Clear all execution history
   */
  static clearHistory(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Export history as JSON
   */
  static exportHistory(): string {
    const histories = this.getHistories();
    return JSON.stringify(histories, null, 2);
  }

  /**
   * Import history from JSON
   */
  static importHistory(jsonData: string): boolean {
    try {
      const parsed = JSON.parse(jsonData);
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid history format');
      }
      
      // Validate the structure
      const validHistories = parsed.filter(this.isValidHistoryItem);
      this.saveHistories(validHistories.slice(0, MAX_HISTORY_ITEMS));
      
      return true;
    } catch (error) {
      console.error('Error importing history:', error);
      return false;
    }
  }

  /**
   * Get execution by ID
   */
  static getExecutionById(id: string): ExecutionHistory | null {
    const histories = this.getHistories();
    return histories.find(h => h.id === id) || null;
  }

  /**
   * Get all unique tags from history
   */
  static getAllTags(): string[] {
    const histories = this.getHistories();
    const allTags = histories.flatMap(h => h.tags);
    return Array.from(new Set(allTags)).sort();
  }

  /**
   * Get history statistics
   */
  static getStatistics() {
    const histories = this.getHistories();
    
    if (histories.length === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        averageExecutionTime: 0,
        totalTests: 0
      };
    }
    
    const successCount = histories.filter(h => h.resultSummary.status === 'success').length;
    const totalTests = histories.reduce((sum, h) => sum + h.resultSummary.total, 0);
    const executionTimes = histories
      .map(h => h.resultSummary.executionTime)
      .filter(time => time !== undefined) as number[];
    
    const averageExecutionTime = executionTimes.length > 0 
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length 
      : 0;
    
    return {
      totalExecutions: histories.length,
      successRate: (successCount / histories.length) * 100,
      averageExecutionTime,
      totalTests
    };
  }

  // Private helper methods
  private static generateId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static saveHistories(histories: ExecutionHistory[]): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(histories));
    } catch (error) {
      console.error('Error saving execution history:', error);
    }
  }

  private static extractTags(featureContent: string): string[] {
    const tagRegex = /@(\w+)/g;
    const tags: string[] = [];
    let match;
    
    while ((match = tagRegex.exec(featureContent)) !== null) {
      tags.push(match[1]);
    }
    
    return Array.from(new Set(tags));
  }

  private static isValidHistoryItem(item: any): item is ExecutionHistory {
    return (
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.timestamp === 'number' &&
      typeof item.featureContent === 'string' &&
      typeof item.configContent === 'string' &&
      typeof item.resultSummary === 'object' &&
      Array.isArray(item.scenarioNames) &&
      Array.isArray(item.tags)
    );
  }
}
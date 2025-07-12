import { useState, useEffect } from 'react';

/**
 * Custom hook for managing localStorage with SSR compatibility
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        return initialValue;
      }
      
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Hook for managing panel sizes with localStorage persistence
 */
export function usePanelSizes(defaultSizes: number[]) {
  const [sizes, setSizes] = useLocalStorage('kaas-panel-sizes', defaultSizes);

  // Validate sizes array
  const validateSizes = (newSizes: number[]): number[] => {
    // Ensure we have the correct number of panels
    if (newSizes.length !== defaultSizes.length) {
      return defaultSizes;
    }

    // Ensure all sizes are positive numbers and sum to 100
    const validSizes = newSizes.every(size => 
      typeof size === 'number' && size > 0 && size <= 100
    );

    if (!validSizes) {
      return defaultSizes;
    }

    // Normalize to ensure they sum to 100
    const total = newSizes.reduce((sum, size) => sum + size, 0);
    if (Math.abs(total - 100) > 0.1) {
      return newSizes.map(size => (size / total) * 100);
    }

    return newSizes;
  };

  const updateSizes = (newSizes: number[]) => {
    const validatedSizes = validateSizes(newSizes);
    setSizes(validatedSizes);
  };

  return [validateSizes(sizes), updateSizes] as const;
}
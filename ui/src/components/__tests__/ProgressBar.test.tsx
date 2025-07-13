import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProgressBar, TestProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  describe('Basic ProgressBar', () => {
    it('should render with correct percentage', () => {
      render(<ProgressBar value={75} max={100} />);
      
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('75/100')).toBeInTheDocument();
    });

    it('should handle value greater than max', () => {
      render(<ProgressBar value={150} max={100} />);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle zero max value', () => {
      render(<ProgressBar value={10} max={0} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('10/0')).toBeInTheDocument();
    });

    it('should render different variants correctly', () => {
      const { rerender } = render(<ProgressBar value={50} max={100} variant="success" />);
      
      let progressBar = document.querySelector('.bg-green-500');
      expect(progressBar).toBeInTheDocument();
      
      rerender(<ProgressBar value={50} max={100} variant="error" />);
      progressBar = document.querySelector('.bg-red-500');
      expect(progressBar).toBeInTheDocument();
    });

    it('should render different sizes correctly', () => {
      const { rerender } = render(<ProgressBar value={50} max={100} size="sm" />);
      
      let progressContainer = document.querySelector('.h-1');
      expect(progressContainer).toBeInTheDocument();
      
      rerender(<ProgressBar value={50} max={100} size="lg" />);
      progressContainer = document.querySelector('.h-3');
      expect(progressContainer).toBeInTheDocument();
    });

    it('should hide label when showLabel is false', () => {
      render(<ProgressBar value={75} max={100} showLabel={false} />);
      
      expect(screen.queryByText('75%')).not.toBeInTheDocument();
      expect(screen.queryByText('75/100')).not.toBeInTheDocument();
    });
  });

  describe('TestProgressBar', () => {
    it('should render test progress with segments', () => {
      render(
        <TestProgressBar
          passed={8}
          failed={2}
          total={10}
          showSegments={true}
        />
      );
      
      expect(screen.getByText('8 Passed')).toBeInTheDocument();
      expect(screen.getByText('2 Failed')).toBeInTheDocument();
      expect(screen.getByText('10 Total')).toBeInTheDocument();
    });

    it('should not show failed section when no failures', () => {
      render(
        <TestProgressBar
          passed={10}
          failed={0}
          total={10}
          showSegments={true}
        />
      );
      
      expect(screen.getByText('10 Passed')).toBeInTheDocument();
      expect(screen.queryByText('0 Failed')).not.toBeInTheDocument();
      expect(screen.getByText('10 Total')).toBeInTheDocument();
    });

    it('should show skipped section when applicable', () => {
      render(
        <TestProgressBar
          passed={6}
          failed={2}
          total={10}
          showSegments={true}
        />
      );
      
      expect(screen.getByText('6 Passed')).toBeInTheDocument();
      expect(screen.getByText('2 Failed')).toBeInTheDocument();
      expect(screen.getByText('2 Skipped')).toBeInTheDocument();
      expect(screen.getByText('10 Total')).toBeInTheDocument();
    });

    it('should render as simple progress bar when showSegments is false', () => {
      render(
        <TestProgressBar
          passed={8}
          failed={2}
          total={10}
          showSegments={false}
        />
      );
      
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('8/10')).toBeInTheDocument();
    });

    it('should handle zero total correctly', () => {
      render(
        <TestProgressBar
          passed={0}
          failed={0}
          total={0}
          showSegments={true}
        />
      );
      
      expect(screen.getByText('0 Passed')).toBeInTheDocument();
      expect(screen.getByText('0 Total')).toBeInTheDocument();
    });
  });
});
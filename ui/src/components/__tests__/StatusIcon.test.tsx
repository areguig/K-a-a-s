import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusIcon, StatusIndicator, TestStatusBadge } from '../StatusIcon';

describe('StatusIcon', () => {
  it('should render passed status correctly', () => {
    const { container } = render(<StatusIcon status="passed" />);
    
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('text-green-600');
  });

  it('should render failed status correctly', () => {
    const { container } = render(<StatusIcon status="failed" />);
    
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('text-red-600');
  });

  it('should render running status correctly', () => {
    const { container } = render(<StatusIcon status="running" />);
    
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('text-blue-600');
  });

  it('should apply correct size classes', () => {
    const { container, rerender } = render(<StatusIcon status="passed" size="sm" />);
    
    let icon = container.querySelector('svg');
    expect(icon).toHaveClass('w-4', 'h-4');
    
    rerender(<StatusIcon status="passed" size="xl" />);
    icon = container.querySelector('svg');
    expect(icon).toHaveClass('w-8', 'h-8');
  });

  it('should apply animation classes when animated is true', () => {
    const { container } = render(<StatusIcon status="passed" animated={true} />);
    
    const icon = container.querySelector('svg');
    expect(icon).toHaveClass('animate-bounce');
  });

  it('should not apply animation classes when animated is false', () => {
    const { container } = render(<StatusIcon status="passed" animated={false} />);
    
    const icon = container.querySelector('svg');
    expect(icon).not.toHaveClass('animate-bounce');
  });
});

describe('StatusIndicator', () => {
  it('should render with default label for status', () => {
    render(<StatusIndicator status="passed" />);
    
    expect(screen.getByText('Passed')).toBeInTheDocument();
  });

  it('should render with custom label', () => {
    render(<StatusIndicator status="passed" label="All Good" />);
    
    expect(screen.getByText('All Good')).toBeInTheDocument();
  });

  it('should render with count when provided', () => {
    render(<StatusIndicator status="failed" count={5} />);
    
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should hide count when showCount is false', () => {
    render(<StatusIndicator status="failed" count={5} showCount={false} />);
    
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.queryByText('5')).not.toBeInTheDocument();
  });

  it('should apply correct color classes for different statuses', () => {
    const { container, rerender } = render(<StatusIndicator status="passed" />);
    
    let indicator = container.querySelector('.bg-green-50');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('text-green-700', 'border-green-200');
    
    rerender(<StatusIndicator status="failed" />);
    indicator = container.querySelector('.bg-red-50');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('text-red-700', 'border-red-200');
  });
});

describe('TestStatusBadge', () => {
  it('should show running status when isRunning is true', () => {
    render(
      <TestStatusBadge
        passed={5}
        failed={0}
        total={10}
        isRunning={true}
      />
    );
    
    expect(screen.getByText('Running Tests...')).toBeInTheDocument();
  });

  it('should show failed status when there are failures', () => {
    render(
      <TestStatusBadge
        passed={8}
        failed={2}
        total={10}
        isRunning={false}
      />
    );
    
    expect(screen.getByText('2 Tests Failed')).toBeInTheDocument();
  });

  it('should show singular form for single failure', () => {
    render(
      <TestStatusBadge
        passed={9}
        failed={1}
        total={10}
        isRunning={false}
      />
    );
    
    expect(screen.getByText('1 Test Failed')).toBeInTheDocument();
  });

  it('should show all passed status when all tests pass', () => {
    render(
      <TestStatusBadge
        passed={10}
        failed={0}
        total={10}
        isRunning={false}
      />
    );
    
    expect(screen.getByText('All Tests Passed')).toBeInTheDocument();
  });

  it('should show partial passed status when some tests pass', () => {
    render(
      <TestStatusBadge
        passed={7}
        failed={0}
        total={10}
        isRunning={false}
      />
    );
    
    expect(screen.getByText('7/10 Tests Passed')).toBeInTheDocument();
  });

  it('should show no tests run status when no tests', () => {
    render(
      <TestStatusBadge
        passed={0}
        failed={0}
        total={0}
        isRunning={false}
      />
    );
    
    expect(screen.getByText('No Tests Run')).toBeInTheDocument();
  });
});
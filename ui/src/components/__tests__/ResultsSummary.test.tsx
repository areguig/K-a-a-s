import { render, screen } from '@testing-library/react'
import { ResultsSummary } from '../ResultsSummary'
import { KarateResult } from '../../types/karate'

const mockResult: KarateResult = {
  scenariosList: [],
  status: 'passed',
  time: 1500,
  features: {
    passed: 1,
    total: 1
  },
  scenarios: {
    passed: 3,
    failed: 1,
    total: 4
  },
  logs: []
}

describe('ResultsSummary', () => {
  it('renders enhanced test summary correctly', () => {
    render(<ResultsSummary result={mockResult} />)
    
    expect(screen.getByText('Test Execution Summary')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument() // passed scenarios
    expect(screen.getByText('1')).toBeInTheDocument() // failed scenarios
    expect(screen.getByText('4')).toBeInTheDocument() // total scenarios
    expect(screen.getByText('1.5s')).toBeInTheDocument() // formatted execution time
  })

  it('displays success rates and progress', () => {
    render(<ResultsSummary result={mockResult} />)
    
    expect(screen.getByText('75%')).toBeInTheDocument() // success rate
    expect(screen.getByText('3/4 scenarios')).toBeInTheDocument() // scenarios ratio
    expect(screen.getByText('1/1')).toBeInTheDocument() // features ratio
    expect(screen.getByText('Execution Progress')).toBeInTheDocument()
  })

  it('displays status indicators correctly', () => {
    render(<ResultsSummary result={mockResult} />)
    
    expect(screen.getByText('75% success rate')).toBeInTheDocument()
    expect(screen.getByText('25% failure rate')).toBeInTheDocument()
    expect(screen.getByText('Scenarios executed')).toBeInTheDocument()
  })

  it('shows running state when isRunning is true', () => {
    render(<ResultsSummary result={mockResult} isRunning={true} />)
    
    expect(screen.getByText('Running Tests...')).toBeInTheDocument()
  })

  it('shows all passed status when no failures', () => {
    const allPassedResult = {
      ...mockResult,
      scenarios: { passed: 4, failed: 0, total: 4 }
    }
    
    render(<ResultsSummary result={allPassedResult} />)
    
    expect(screen.getByText('All Tests Passed')).toBeInTheDocument()
    expect(screen.getByText('No failures')).toBeInTheDocument()
  })

  it('formats execution time correctly', () => {
    const { rerender } = render(<ResultsSummary result={{
      ...mockResult,
      time: 500
    }} />)
    
    expect(screen.getByText('500ms')).toBeInTheDocument()
    
    rerender(<ResultsSummary result={{
      ...mockResult,
      time: 65000
    }} />)
    
    expect(screen.getByText('1m 5s')).toBeInTheDocument()
  })

  it('calculates average time per scenario', () => {
    render(<ResultsSummary result={mockResult} />)
    
    // 1500ms / 4 scenarios = 375ms per scenario
    expect(screen.getByText('~375ms per scenario')).toBeInTheDocument()
  })
})
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
  it('renders test results correctly', () => {
    render(<ResultsSummary result={mockResult} />)
    
    expect(screen.getByText('Test Results')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument() // passed scenarios
    expect(screen.getByText('1')).toBeInTheDocument() // failed scenarios
    expect(screen.getByText('4')).toBeInTheDocument() // total scenarios
    expect(screen.getByText('1500ms')).toBeInTheDocument() // execution time
  })

  it('displays correct pass/fail ratios', () => {
    render(<ResultsSummary result={mockResult} />)
    
    expect(screen.getByText('3/4')).toBeInTheDocument() // scenarios ratio
    expect(screen.getByText('1/1')).toBeInTheDocument() // features ratio
  })
})
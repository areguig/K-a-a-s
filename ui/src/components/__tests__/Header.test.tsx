import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../Header'
import { KarateVersions } from '../../types/karate'

const mockVersions: KarateVersions = {
  karate: '1.4.0',
  java: '21.0.1'
}

describe('Header', () => {
  const mockOnRunTests = jest.fn()

  beforeEach(() => {
    mockOnRunTests.mockClear()
  })

  it('renders KaaS title and subtitle', () => {
    render(<Header onRunTests={mockOnRunTests} />)
    
    expect(screen.getByText('KaaS')).toBeInTheDocument()
    expect(screen.getByText('Karate as a Service')).toBeInTheDocument()
  })

  it('shows API disconnected status when no versions provided', () => {
    render(<Header onRunTests={mockOnRunTests} />)
    
    expect(screen.getByText('API Disconnected')).toBeInTheDocument()
  })

  it('shows API connected status when versions are provided', () => {
    render(<Header versions={mockVersions} onRunTests={mockOnRunTests} />)
    
    expect(screen.getByText('API Connected')).toBeInTheDocument()
  })

  it('displays version information when provided', () => {
    render(<Header versions={mockVersions} onRunTests={mockOnRunTests} />)
    
    expect(screen.getByText('1.4.0')).toBeInTheDocument()
    expect(screen.getByText('21.0.1')).toBeInTheDocument()
  })

  it('shows running state when isRunning is true', () => {
    render(<Header versions={mockVersions} isRunning={true} onRunTests={mockOnRunTests} />)
    
    expect(screen.getByText('Running Tests...')).toBeInTheDocument()
  })

  it('shows last execution time when provided', () => {
    render(
      <Header 
        versions={mockVersions} 
        lastExecutionTime={1500} 
        onRunTests={mockOnRunTests} 
      />
    )
    
    expect(screen.getByText('Last run:')).toBeInTheDocument()
    expect(screen.getByText('1.5s')).toBeInTheDocument()
  })

  it('calls onRunTests when run button is clicked', () => {
    render(<Header versions={mockVersions} onRunTests={mockOnRunTests} />)
    
    const runButton = screen.getByRole('button', { name: /run tests/i })
    fireEvent.click(runButton)
    
    expect(mockOnRunTests).toHaveBeenCalledTimes(1)
  })

  it('disables run button when API is disconnected', () => {
    render(<Header onRunTests={mockOnRunTests} />)
    
    const runButton = screen.getByRole('button', { name: /run tests/i })
    expect(runButton).toBeDisabled()
  })

  it('disables run button when tests are running', () => {
    render(<Header versions={mockVersions} isRunning={true} onRunTests={mockOnRunTests} />)
    
    const runButton = screen.getByRole('button', { name: /running tests/i })
    expect(runButton).toBeDisabled()
  })
})
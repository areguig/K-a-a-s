import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../Header'
import { KarateVersions } from '../../types/karate'

const mockVersions: KarateVersions = {
  karate: '1.4.0',
  java: '21.0.1'
}

describe('Header', () => {
  it('renders KaaS title and subtitle', () => {
    render(<Header />)
    
    expect(screen.getByText('KaaS')).toBeInTheDocument()
    expect(screen.getByText('Karate as a Service')).toBeInTheDocument()
  })

  it('shows API disconnected status when no versions provided', () => {
    render(<Header />)
    
    expect(screen.getByText('API Disconnected')).toBeInTheDocument()
  })

  it('shows API connected status when versions are provided', () => {
    render(<Header versions={mockVersions} />)
    
    expect(screen.getByText('API Connected')).toBeInTheDocument()
  })

  it('displays version information when provided', () => {
    render(<Header versions={mockVersions} />)
    
    expect(screen.getByText('1.4.0')).toBeInTheDocument()
    expect(screen.getByText('21.0.1')).toBeInTheDocument()
  })

  it('accepts isRunning prop without errors', () => {
    render(<Header versions={mockVersions} isRunning={true} />)
    
    expect(screen.getByText('KaaS')).toBeInTheDocument()
  })

  it('shows last execution time when provided', () => {
    render(
      <Header 
        versions={mockVersions} 
        lastExecutionTime={1500}
      />
    )
    
    expect(screen.getByText('Last run:')).toBeInTheDocument()
    expect(screen.getByText('1.5s')).toBeInTheDocument()
  })

})
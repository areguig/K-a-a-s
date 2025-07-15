import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../Header'
import { KarateVersions } from '../../types/karate'

const mockVersions: KarateVersions = {
  name: 'KaaS API - Karate as a Service',
  description: 'High-performance REST API for executing Karate tests on-demand',
  version: {
    javaVersion: '21.0.1',
    karateVersion: '1.4.0',
    gitCommit: 'abc123',
    gitBranch: 'main',
    buildTime: '2023-10-01T12:00:00Z',
    gitDirty: false,
    springBootVersion: '2.5.4',
    fullVersion: '1.4.0 (Java 21.0.1, Spring Boot 2.5.4)',
    version: '1.4.0',
  },
  resources: {
    trackedFiles: 0,
    tempDirectory: '/tmp/karate',
    activeExecutions: 0,
  },
  timestamp: 1652600052789,
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

  it('displays git branch information when provided', () => {
    render(<Header versions={mockVersions} />)
    
    expect(screen.getByText('main')).toBeInTheDocument()
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
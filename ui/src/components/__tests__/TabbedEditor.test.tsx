import { render, screen, fireEvent } from '@testing-library/react'
import { TabbedEditor } from '../TabbedEditor'

const mockProps = {
  featureContent: 'Feature: Test\nScenario: Test scenario',
  configContent: '{"logLevel": "debug"}',
  onFeatureChange: jest.fn(),
  onConfigChange: jest.fn(),
}

describe('TabbedEditor', () => {
  beforeEach(() => {
    mockProps.onFeatureChange.mockClear()
    mockProps.onConfigChange.mockClear()
  })

  it('renders both tabs correctly', () => {
    render(<TabbedEditor {...mockProps} />)
    
    expect(screen.getByText('Feature File')).toBeInTheDocument()
    expect(screen.getByText('Configuration')).toBeInTheDocument()
  })

  it('starts with feature tab active', () => {
    render(<TabbedEditor {...mockProps} />)
    
    const featureTab = screen.getByRole('button', { name: /feature file/i })
    const configTab = screen.getByRole('button', { name: /configuration/i })
    
    expect(featureTab).toHaveClass('text-brand-primary')
    expect(configTab).toHaveClass('text-gray-600')
  })

  it('switches tabs when clicked', () => {
    render(<TabbedEditor {...mockProps} />)
    
    const configTab = screen.getByRole('button', { name: /configuration/i })
    fireEvent.click(configTab)
    
    expect(configTab).toHaveClass('text-brand-primary')
  })

  it('displays correct file info for feature tab', () => {
    render(<TabbedEditor {...mockProps} />)
    
    expect(screen.getByText(/gherkin/i)).toBeInTheDocument()
    expect(screen.getByText(/\.feature/)).toBeInTheDocument()
    expect(screen.getByText(/2 lines/)).toBeInTheDocument() // featureContent has 2 lines
  })

  it('displays correct file info for config tab', () => {
    render(<TabbedEditor {...mockProps} />)
    
    const configTab = screen.getByRole('button', { name: /configuration/i })
    fireEvent.click(configTab)
    
    // More specific selectors to avoid multiple matches
    expect(screen.getByText(/JSON •/)).toBeInTheDocument()
    expect(screen.getByText('.json')).toBeInTheDocument()
    expect(screen.getByText(/1 lines/)).toBeInTheDocument() // configContent has 1 line
  })

  it('renders fullscreen toggle button', () => {
    render(<TabbedEditor {...mockProps} />)
    
    const fullscreenButton = screen.getByTitle('Enter fullscreen')
    expect(fullscreenButton).toBeInTheDocument()
  })

  it('toggles fullscreen mode when button is clicked', () => {
    render(<TabbedEditor {...mockProps} />)
    
    const fullscreenButton = screen.getByTitle('Enter fullscreen')
    fireEvent.click(fullscreenButton)
    
    expect(screen.getByTitle('Exit fullscreen')).toBeInTheDocument()
  })

  it('renders Monaco editor with correct props for feature tab', () => {
    render(<TabbedEditor {...mockProps} />)
    
    const editor = screen.getByTestId('monaco-editor')
    expect(editor).toBeInTheDocument()
    expect(editor).toHaveValue(mockProps.featureContent)
  })

  it('renders Monaco editor with correct props for config tab', () => {
    render(<TabbedEditor {...mockProps} />)
    
    const configTab = screen.getByRole('button', { name: /configuration/i })
    fireEvent.click(configTab)
    
    const editor = screen.getByTestId('monaco-editor')
    expect(editor).toHaveValue(mockProps.configContent)
  })

  it('calls onFeatureChange when feature content changes', () => {
    render(<TabbedEditor {...mockProps} />)
    
    const editor = screen.getByTestId('monaco-editor')
    fireEvent.change(editor, { target: { value: 'new feature content' } })
    
    expect(mockProps.onFeatureChange).toHaveBeenCalledWith('new feature content')
  })

  it('calls onConfigChange when config content changes', () => {
    render(<TabbedEditor {...mockProps} />)
    
    const configTab = screen.getByRole('button', { name: /configuration/i })
    fireEvent.click(configTab)
    
    const editor = screen.getByTestId('monaco-editor')
    fireEvent.change(editor, { target: { value: 'new config content' } })
    
    expect(mockProps.onConfigChange).toHaveBeenCalledWith('new config content')
  })
})
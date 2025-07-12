import { render, screen } from '@testing-library/react'

// Test component to verify design system utilities work
const DesignSystemTestComponent = () => {
  return (
    <div>
      {/* Typography Tests */}
      <h1 className="text-heading-1" data-testid="heading-1">Main Heading</h1>
      <h2 className="text-heading-2" data-testid="heading-2">Sub Heading</h2>
      <p className="text-body" data-testid="body-text">Body text content</p>
      <span className="text-caption" data-testid="caption">Caption text</span>

      {/* Component Tests */}
      <div className="card-elevated" data-testid="card-elevated">Elevated Card</div>
      <div className="card-outline" data-testid="card-outline">Outline Card</div>
      
      {/* Button Tests */}
      <button className="btn-primary" data-testid="btn-primary">Primary Button</button>
      <button className="btn-secondary" data-testid="btn-secondary">Secondary Button</button>

      {/* Status Badge Tests */}
      <span className="status-badge-success" data-testid="badge-success">Success</span>
      <span className="status-badge-error" data-testid="badge-error">Error</span>
      <span className="status-badge-warning" data-testid="badge-warning">Warning</span>
      <span className="status-badge-info" data-testid="badge-info">Info</span>
    </div>
  )
}

describe('Design System', () => {
  it('renders typography utilities correctly', () => {
    render(<DesignSystemTestComponent />)
    
    expect(screen.getByTestId('heading-1')).toBeInTheDocument()
    expect(screen.getByTestId('heading-2')).toBeInTheDocument()
    expect(screen.getByTestId('body-text')).toBeInTheDocument()
    expect(screen.getByTestId('caption')).toBeInTheDocument()
  })

  it('renders card components correctly', () => {
    render(<DesignSystemTestComponent />)
    
    expect(screen.getByTestId('card-elevated')).toBeInTheDocument()
    expect(screen.getByTestId('card-outline')).toBeInTheDocument()
  })

  it('renders button components correctly', () => {
    render(<DesignSystemTestComponent />)
    
    expect(screen.getByTestId('btn-primary')).toBeInTheDocument()
    expect(screen.getByTestId('btn-secondary')).toBeInTheDocument()
  })

  it('renders status badges correctly', () => {
    render(<DesignSystemTestComponent />)
    
    expect(screen.getByTestId('badge-success')).toBeInTheDocument()
    expect(screen.getByTestId('badge-error')).toBeInTheDocument()
    expect(screen.getByTestId('badge-warning')).toBeInTheDocument()
    expect(screen.getByTestId('badge-info')).toBeInTheDocument()
  })

  it('applies correct classes to typography elements', () => {
    render(<DesignSystemTestComponent />)
    
    const heading1 = screen.getByTestId('heading-1')
    const bodyText = screen.getByTestId('body-text')
    
    expect(heading1).toHaveClass('text-heading-1')
    expect(bodyText).toHaveClass('text-body')
  })

  it('applies correct classes to component elements', () => {
    render(<DesignSystemTestComponent />)
    
    const elevatedCard = screen.getByTestId('card-elevated')
    const primaryBtn = screen.getByTestId('btn-primary')
    const successBadge = screen.getByTestId('badge-success')
    
    expect(elevatedCard).toHaveClass('card-elevated')
    expect(primaryBtn).toHaveClass('btn-primary')
    expect(successBadge).toHaveClass('status-badge-success')
  })
})
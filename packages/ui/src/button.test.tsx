import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies primary variant by default', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByText('Click me')
    expect(button.className).toContain('bg-blue-600')
  })

  it('applies secondary variant when specified', () => {
    render(<Button variant="secondary">Click me</Button>)
    const button = screen.getByText('Click me')
    expect(button.className).toContain('bg-gray-600')
  })

  it('applies correct size classes', () => {
    render(<Button size="lg">Large Button</Button>)
    const button = screen.getByText('Large Button')
    expect(button.className).toContain('h-12')
  })

  it('forwards props to button element', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByText('Disabled')
    expect(button).toBeDisabled()
  })
})

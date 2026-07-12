// src/components/ui/Badge.test.jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge, RoleBadge, Badge } from './Badge'

describe('StatusBadge', () => {
  it('renders the pending status label', () => {
    render(<StatusBadge status="pending" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('renders the active status label', () => {
    render(<StatusBadge status="active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders the resolved status label', () => {
    render(<StatusBadge status="resolved" />)
    expect(screen.getByText('Resolved')).toBeInTheDocument()
  })

  it('falls back to pending for unknown status', () => {
    render(<StatusBadge status="unknown" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })
})

describe('RoleBadge', () => {
  it('renders client role capitalized', () => {
    render(<RoleBadge role="client" />)
    expect(screen.getByText('Client')).toBeInTheDocument()
  })

  it('renders admin role capitalized', () => {
    render(<RoleBadge role="admin" />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('renders partner role capitalized', () => {
    render(<RoleBadge role="partner" />)
    expect(screen.getByText('Partner')).toBeInTheDocument()
  })

  it('falls back to Client when role is null', () => {
    render(<RoleBadge role={null} />)
    expect(screen.getByText('Client')).toBeInTheDocument()
  })
})

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Custom Badge</Badge>)
    expect(screen.getByText('Custom Badge')).toBeInTheDocument()
  })

  it('applies the default variant', () => {
    const { container } = render(<Badge>Default</Badge>)
    const badge = container.firstChild
    expect(badge).toHaveClass('bg-white/8')
  })

  it('applies the gold variant', () => {
    const { container } = render(<Badge variant="gold">Gold</Badge>)
    const badge = container.firstChild
    expect(badge).toHaveClass('bg-gold-500/10')
    expect(badge).toHaveClass('text-gold-400')
  })

  it('applies the red variant', () => {
    const { container } = render(<Badge variant="red">Error</Badge>)
    const badge = container.firstChild
    expect(badge).toHaveClass('bg-red-500/10')
    expect(badge).toHaveClass('text-red-400')
  })
})

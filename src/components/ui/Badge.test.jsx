// src/components/ui/Badge.test.jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge, RoleBadge, Badge } from './Badge'

describe('StatusBadge', () => {
  it('renders the pending status label (i18n key case.pending)', () => {
    render(<StatusBadge status="pending" />)
    // Mock t() returns the last segment capitalized: 'Pending'
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('renders the active status label (i18n key case.active)', () => {
    render(<StatusBadge status="active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders the resolved status label (i18n key case.resolved)', () => {
    render(<StatusBadge status="resolved" />)
    expect(screen.getByText('Resolved')).toBeInTheDocument()
  })

  it('falls back to pending for unknown status', () => {
    render(<StatusBadge status="unknown" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })
})

describe('RoleBadge', () => {
  it('renders client role via i18n', () => {
    render(<RoleBadge role="client" />)
    expect(screen.getByText('Client')).toBeInTheDocument()
  })

  it('renders admin role via i18n', () => {
    render(<RoleBadge role="admin" />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('renders partner role via i18n', () => {
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
    expect(badge).toHaveClass('bg-[var(--text-primary)]/8')
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
    expect(badge).toHaveClass('bg-[var(--status-error)]/10')
    expect(badge).toHaveClass('text-[var(--status-error)]')
  })
})

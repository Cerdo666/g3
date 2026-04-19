/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Sidebar from '../app/components/Sidebar'

describe('Sidebar Component', () => {
  it('should render sidebar title "EXAMPLE QUERIES"', () => {
    render(<Sidebar onQuerySelect={() => {}} />)
    expect(screen.getByText(/EXAMPLE QUERIES/i)).toBeInTheDocument()
  })

  it('should render example query cards', () => {
    render(<Sidebar onQuerySelect={() => {}} />)
    expect(screen.getByText(/BRCA1/i)).toBeInTheDocument()
    expect(screen.getByText(/luminal breast cancer A/i)).toBeInTheDocument()
    expect(screen.getByText(/HER2/i)).toBeInTheDocument()
  })

  it('should show footer with copyright and legal links', () => {
    render(<Sidebar onQuerySelect={() => {}} />)
    expect(screen.getByText(/© 2026 OncoQuery/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Privacy Policy/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Terms of Service/i })).toBeInTheDocument()
  })

  it('should render collapse button when onCollapse is provided', () => {
    render(<Sidebar onQuerySelect={() => {}} onCollapse={() => {}} />)
    expect(screen.getByLabelText(/Collapse sidebar/i)).toBeInTheDocument()
  })

  it('should not render collapse button when onCollapse is not provided', () => {
    render(<Sidebar onQuerySelect={() => {}} />)
    expect(screen.queryByLabelText(/Collapse sidebar/i)).not.toBeInTheDocument()
  })
})

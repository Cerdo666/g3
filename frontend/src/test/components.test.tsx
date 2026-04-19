/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Header from '../app/components/Header'

describe('Header Component', () => {
  it('should render OncoQuery logo and title', () => {
    render(<Header />)
    expect(screen.getByText('OncoQuery')).toBeInTheDocument()
    expect(screen.getByText('BETA')).toBeInTheDocument()
  })

  it('should show Sign in and Sign up buttons when not authenticated', () => {
    render(<Header isAuthenticated={false} />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('should show user email and Sign out button when authenticated', () => {
    render(
      <Header 
        isAuthenticated={true} 
        userEmail="test@example.com"
        userName="Test User"
      />
    )
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('should show Projects button when authenticated', () => {
    render(<Header isAuthenticated={true} />)
    expect(screen.getByRole('button', { name: /projects/i })).toBeInTheDocument()
  })

  it('should show Admin button only for admin role', () => {
    const { rerender } = render(
      <Header isAuthenticated={true} userRole="user" />
    )
    expect(screen.queryByRole('button', { name: /admin/i })).not.toBeInTheDocument()

    rerender(
      <Header isAuthenticated={true} userRole="admin" />
    )
    expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument()
  })

  it('should call onSignOut callback when Sign out is clicked', async () => {
    const handleSignOut = vi.fn()
    const user = userEvent.setup()
    
    render(
      <Header 
        isAuthenticated={true} 
        onSignOut={handleSignOut}
      />
    )
    
    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    await user.click(signOutButton)
    expect(handleSignOut).toHaveBeenCalled()
  })

  it('should call onOpenSignIn when Sign in is clicked', async () => {
    const handleOpenSignIn = vi.fn()
    const user = userEvent.setup()
    
    render(
      <Header 
        isAuthenticated={false}
        onOpenSignIn={handleOpenSignIn}
      />
    )
    
    const signInButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(signInButton)
    expect(handleOpenSignIn).toHaveBeenCalled()
  })
})

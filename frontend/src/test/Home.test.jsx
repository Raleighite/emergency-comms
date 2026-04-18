import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import Home from '../pages/Home'

// Mock useAuth
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false, login: vi.fn(), logout: vi.fn() }),
}))

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('Home', () => {
  it('renders the tagline', () => {
    renderWithRouter(<Home />)
    expect(screen.getByText('Keep Everyone Updated')).toBeInTheDocument()
  })

  it('shows Get Started button when logged out', () => {
    renderWithRouter(<Home />)
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })

  it('shows the 3-step process', () => {
    renderWithRouter(<Home />)
    expect(screen.getByText('Create an Event')).toBeInTheDocument()
    expect(screen.getByText('Share the Link')).toBeInTheDocument()
    expect(screen.getByText('Post Updates')).toBeInTheDocument()
  })
})

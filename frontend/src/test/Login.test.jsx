import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import Login from '../pages/Login'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false, login: vi.fn(), logout: vi.fn() }),
}))

vi.mock('../api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { available: false } })),
    post: vi.fn(() => Promise.resolve({ data: { message: 'Sent' } })),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('Login', () => {
  it('renders login heading', () => {
    renderWithRouter(<Login />)
    expect(screen.getByText('Log in to your account')).toBeInTheDocument()
  })

  it('shows email input by default', () => {
    renderWithRouter(<Login />)
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
  })

  it('shows send login link button', () => {
    renderWithRouter(<Login />)
    expect(screen.getByText('Send Login Link')).toBeInTheDocument()
  })
})

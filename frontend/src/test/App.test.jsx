import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from '../App'

// Mock axios
vi.mock('../api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { available: false } })),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

describe('App', () => {
  it('renders the nav with Emergency Comms branding', () => {
    render(<App />)
    expect(screen.getByText('Emergency Comms')).toBeInTheDocument()
  })

  it('shows login link when not authenticated', () => {
    localStorage.clear()
    render(<App />)
    expect(screen.getByText('Log in')).toBeInTheDocument()
  })

  it('renders the home page content', () => {
    localStorage.clear()
    render(<App />)
    expect(screen.getByText('Keep Everyone Updated')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })
})

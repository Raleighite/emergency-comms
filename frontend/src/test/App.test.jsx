import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from '../App'

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

  it('renders the home page hero', () => {
    localStorage.clear()
    render(<App />)
    expect(screen.getByText('One link. Everyone informed.')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })
})

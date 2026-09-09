import { useState, type SyntheticEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { AuthUser } from '../types/auth.ts'
import '../styles/auth.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

interface CreateAccountPageProps {
  onAuthenticated: (user: AuthUser) => void
}

interface ApiError {
  detail?: string | Array<{ msg: string }>
}

export default function CreateAccountPage({
  onAuthenticated,
}: CreateAccountPageProps) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const body = (await response.json()) as AuthUser | ApiError

      if (!response.ok) {
        const detail = (body as ApiError).detail
        throw new Error(
          typeof detail === 'string'
            ? detail
            : detail?.[0]?.msg ?? 'Unable to create your account',
        )
      }

      onAuthenticated(body as AuthUser)
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to connect to the server',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="signup-title">
        <div className="auth-heading">
          <h1 id="signup-title">Create account</h1>
          <p>Choose a username and password.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              autoComplete="username"
              minLength={3}
              maxLength={100}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username"
              required
              value={username}
            />
          </label>

          <label>
            Password
            <input
              autoComplete="new-password"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a password"
              required
              type="password"
              value={password}
            />
            <small>Use at least 8 characters.</small>
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : 'Create account'}
          </button>
        </form>

        <div className="auth-secondary">
          <p>Already have an account?</p>
          <Link to="/signin">Sign in</Link>
        </div>
      </section>
    </main>
  )
}

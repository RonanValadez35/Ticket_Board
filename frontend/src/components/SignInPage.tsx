import { useState, type SyntheticEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { AuthUser } from '../types/auth.ts'
import '../styles/auth.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

interface SignInPageProps {
  onAuthenticated: (user: AuthUser) => void
}

interface ApiError {
  detail?: string | Array<{ msg: string }>
}

export default function SignInPage({
  onAuthenticated,
}: SignInPageProps) {
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
      const response = await fetch(`${API_URL}/auth/signin`, {
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
            : detail?.[0]?.msg ?? 'Unable to sign in',
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
      <section className="auth-card" aria-labelledby="signin-title">
        <div className="auth-heading">
          <h1 id="signin-title">Sign in</h1>
          <p>Sign in to access your ticket board.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              autoComplete="username"
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
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              type="password"
              value={password}
            />
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-secondary">
          <p>Don't have an account?</p>
          <Link to="/signup">Create account</Link>
        </div>
      </section>
    </main>
  )
}

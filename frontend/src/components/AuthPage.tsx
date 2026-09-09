import { useState, type SyntheticEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/auth.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export interface AuthUser {
  id: number
  username: string
}

interface AuthPageProps {
  mode: 'signin' | 'signup'
  onAuthenticated: (user: AuthUser) => void
}

interface ApiError {
  detail?: string | Array<{ msg: string }>
}

export default function AuthPage({ mode, onAuthenticated }: AuthPageProps) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSignUp = mode === 'signup'

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/auth/${mode}`, {
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
            : detail?.[0]?.msg ?? 'Unable to complete your request',
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
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-heading">
          <h1 id="auth-title">
            {isSignUp ? 'Create account' : 'Sign in'}
          </h1>
          <p>
            {isSignUp
              ? 'Choose a username and password.'
              : 'Sign in to access your ticket board.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              autoComplete="username"
              minLength={isSignUp ? 3 : 1}
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
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              minLength={isSignUp ? 8 : 1}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={
                isSignUp ? 'Create a password' : 'Enter your password'
              }
              required
              type="password"
              value={password}
            />
            {isSignUp && <small>Use at least 8 characters.</small>}
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Please wait…'
              : isSignUp
                ? 'Create account'
                : 'Sign in'}
          </button>
        </form>

        <div className="auth-secondary">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <Link to={isSignUp ? '/signin' : '/signup'}>
            {isSignUp ? 'Sign in' : 'Create account'}
          </Link>
        </div>
      </section>
    </main>
  )
}

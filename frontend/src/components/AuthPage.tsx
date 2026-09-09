import type { SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'
import '../styles/auth.css'

type AuthPageProps = {
  mode: 'sign-in' | 'create-account'
}

function AuthPage({ mode }: AuthPageProps) {
  const isSignIn = mode === 'sign-in'

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-heading">
          <h1 id="auth-title">
            {isSignIn ? 'Sign in' : 'Create account'}
          </h1>
          <p>
            {isSignIn
              ? 'Sign in to access your ticket board.'
              : 'Choose a username and password.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor={`${mode}-username`}>
            Username
            <input
              id={`${mode}-username`}
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              required
            />
          </label>

          <label htmlFor={`${mode}-password`}>
            Password
            <input
              id={`${mode}-password`}
              name="password"
              type="password"
              autoComplete={isSignIn ? 'current-password' : 'new-password'}
              placeholder={isSignIn ? 'Enter your password' : 'Create a password'}
              required
            />
          </label>

          <button className="auth-submit" type="submit">
            {isSignIn ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="auth-secondary">
          <p>
            {isSignIn ? "Don't have an account?" : 'Already have an account?'}
          </p>
          <Link to={isSignIn ? '/create-account' : '/'}>
            {isSignIn ? 'Create account' : 'Sign in'}
          </Link>
        </div>
      </section>
    </main>
  )
}

export default AuthPage

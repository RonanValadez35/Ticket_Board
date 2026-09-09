import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import '../styles/auth.css'

type AuthPageProps = {
  mode: 'sign-in' | 'create-account'
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  )
}

function AuthPage({ mode }: AuthPageProps) {
  const isSignIn = mode === 'sign-in'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <Link className="auth-brand" to="/" aria-label="Ticket Board home">
          <BrandMark />
          <span>Ticket Board</span>
        </Link>

        <div className="auth-heading">
          <p className="auth-eyebrow">{isSignIn ? 'Welcome back' : 'Get started'}</p>
          <h1 id="auth-title">
            {isSignIn ? 'Sign in to your account' : 'Create your account'}
          </h1>
          <p>
            {isSignIn
              ? 'Enter your details to access your workspace.'
              : 'Set up your credentials to start organizing your work.'}
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

          {isSignIn && (
            <div className="auth-options">
              <label className="remember-me">
                <input type="checkbox" name="remember" />
                <span>Remember me</span>
              </label>
              <button className="text-button" type="button">
                Forgot password?
              </button>
            </div>
          )}

          <button className="auth-submit" type="submit">
            {isSignIn ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          {isSignIn ? "Don't have an account?" : 'Already have an account?'}{' '}
          <Link to={isSignIn ? '/create-account' : '/'}>
            {isSignIn ? 'Create account' : 'Sign in'}
          </Link>
        </p>
      </section>

      <aside className="auth-aside" aria-hidden="true">
        <div className="auth-glow auth-glow-one" />
        <div className="auth-glow auth-glow-two" />
        <div className="preview-card">
          <div className="preview-header">
            <BrandMark />
            <span>Everything in one place</span>
          </div>
          <div className="preview-ticket preview-ticket-one">
            <span className="preview-icon">✓</span>
            <div><strong>Ship with confidence</strong><span>Keep every task moving forward.</span></div>
          </div>
          <div className="preview-ticket preview-ticket-two">
            <span className="preview-icon">↗</span>
            <div><strong>Stay in sync</strong><span>Clear priorities for your whole team.</span></div>
          </div>
        </div>
        <blockquote>
          “A simple workspace for turning ideas into progress.”
        </blockquote>
      </aside>
    </main>
  )
}

export default AuthPage

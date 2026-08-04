import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } 
    catch (err) {
      setError(err.response?.data?.message || 'Could not sign in');
    } 
    finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand-mark">
          <span className="brand-dot" />
          Boardroom
        </div>
        <h1>Welcome back</h1>
        <p className="auth-sub">Sign in to open your boards.</p>

        {error && <div className="form-error">{error}</div>}
        <form onSubmit={submit}>
          <label>Email</label>

          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />

          <label>Password</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
          
          <button className="btn btn-primary btn-block" disabled={busy} type="submit">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

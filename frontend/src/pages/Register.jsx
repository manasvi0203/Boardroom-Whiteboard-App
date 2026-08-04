import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } 
    catch (err) {
      setError(err.response?.data?.message || 'Could not create account');
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
        <h1>Create your account</h1>
        <p className="auth-sub">Start sketching with your team in minutes.</p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={submit}>
          <label>Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ada Lovelace"
          />
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
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 6 characters"
          />
          <button className="btn btn-primary btn-block" disabled={busy} type="submit">
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

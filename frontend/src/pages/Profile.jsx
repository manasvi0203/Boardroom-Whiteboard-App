import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [status, setStatus] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      await updateProfile(form);
      setStatus('Profile updated.');
    } catch (err) {
      setStatus(err.response?.data?.message || 'Could not update profile');
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand-mark">
          <span className="brand-dot" />
          Boardroom
        </div>
        <h1>Your profile</h1>
        {status && <div className="form-note">{status}</div>}
        <form onSubmit={submit}>
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <button className="btn btn-primary btn-block" type="submit">Save changes</button>
        </form>
        <div className="profile-actions">
          <Link to="/dashboard" className="btn btn-ghost btn-block">Back to boards</Link>
          <button
            className="btn btn-ghost btn-block"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

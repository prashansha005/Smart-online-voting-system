import { useState } from 'react';
import { apiRequest } from '../api';

function Register({ goLogin }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'voter',
    organizationName: ''
  });
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setSuccess(false);

    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          organizationName: form.organizationName
        })
      });

      setSuccess(true);
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="auth-card">
      <h2>Register</h2>

      {message && (
        <div className={success ? 'message success' : 'message error'}>{message}</div>
      )}

      <form onSubmit={handleSubmit}>
        <label>Full Name</label>
        <input name="name" value={form.name} onChange={updateField} required />

        <label>Email</label>
        <input name="email" type="email" value={form.email} onChange={updateField} required />

        <label>Role</label>
        <select name="role" value={form.role} onChange={updateField}>
          <option value="voter">Voter</option>
          <option value="admin">Administrator</option>
        </select>

        {form.role === 'admin' && (
          <>
            <label>Organization Name</label>
            <input
              name="organizationName"
              value={form.organizationName}
              onChange={updateField}
              required
            />
          </>
        )}

        <label>Password</label>
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={updateField}
          minLength="6"
          required
        />

        <label>Confirm Password</label>
        <input
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={updateField}
          minLength="6"
          required
        />

        <button className="primary full" type="submit">
          Register
        </button>
      </form>

      <p className="center-text">
        Already registered?{' '}
        <button className="text-button" onClick={goLogin}>
          Go to login
        </button>
      </p>
    </div>
  );
}

export default Register;

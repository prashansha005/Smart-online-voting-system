import { useState } from 'react';
import { apiRequest, saveLogin } from '../api';

function Login({ onLogin, goRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      saveLogin(data);
      onLogin(data.user);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="auth-card">
      <h2>Login</h2>
      <p className="muted">Login as an administrator or voter.</p>

      {message && <div className="message error">{message}</div>}

      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button className="primary full" type="submit">
          Login
        </button>
      </form>

      <p className="center-text">
        New user?{' '}
        <button className="text-button" onClick={goRegister}>
          Register here
        </button>
      </p>
    </div>
  );
}

export default Login;

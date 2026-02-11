import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Lozinke se ne poklapaju');
      return;
    }

    if (password.length < 6) {
      setError('Lozinka mora imati najmanje 6 karaktera');
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Greška prilikom registracije');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Registrujte se</h2>
        
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Korisničko ime</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              style={styles.input}
              placeholder="korisnik123"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="vas@email.com"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Lozinka</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Potvrdite lozinku</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
          >
            {loading ? 'Registrujem...' : 'Registruj se'}
          </button>
        </form>

        <p style={styles.switchText}>
          Već imate nalog?{' '}
          <Link to="/login" style={styles.link}>
            Prijavite se
          </Link>
        </p>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'var(--bg-main)',
    padding: '2rem'
  },
  card: {
    backgroundColor: 'var(--surface)',
    padding: '3rem',
    borderRadius: '10px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    width: '100%',
    maxWidth: '450px'
  },
  title: {
    color: 'var(--text-main)',
    fontSize: '2rem',
    marginBottom: '2rem',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  input: {
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    borderRadius: '5px',
    border: '2px solid var(--border)',
    backgroundColor: 'var(--surface-2)',
    color: 'var(--text-main)',
    outline: 'none',
    transition: 'border-color 0.3s'
  },
  button: {
    padding: '1rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--accent-text)',
    backgroundColor: 'var(--accent)',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    marginTop: '1rem'
  },
  buttonDisabled: {
    backgroundColor: 'var(--surface-3)',
    cursor: 'not-allowed'
  },
  error: {
    padding: '1rem',
    backgroundColor: 'var(--danger)',
    color: 'var(--text-main)',
    borderRadius: '5px',
    marginBottom: '1rem',
    textAlign: 'center'
  },
  switchText: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    marginTop: '2rem'
  },
  link: {
    color: 'var(--accent)',
    textDecoration: 'none',
    fontWeight: '600'
  }
};

export default Register;




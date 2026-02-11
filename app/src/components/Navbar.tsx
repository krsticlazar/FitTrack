import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          <h1 style={styles.logoText}>FitTrack</h1>
        </Link>

        <div style={styles.navLinks}>
          <Link to="/" style={styles.link}>
            Pocetna
          </Link>
          <Link to="/exercises" style={styles.link}>
            Vezbe
          </Link>
          {user && (
            <Link to="/workouts" style={styles.link}>
              Moji treninzi
            </Link>
          )}
        </div>

        <div style={styles.authSection}>
          {user ? (
            <div style={styles.userInfo}>
              <span style={styles.username}>{user.username}</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Odjavi se
              </button>
            </div>
          ) : (
            <div style={styles.authButtons}>
              <Link to="/login" style={styles.loginLink}>
                Prijavi se
              </Link>
              <Link to="/register" style={styles.registerBtn}>
                Registruj se
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  nav: {
    backgroundColor: 'var(--surface)',
    padding: '1rem 0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  logo: {
    textDecoration: 'none',
    color: 'var(--text-main)'
  },
  logoText: {
    margin: 0,
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: 'var(--text-main)'
  },
  navLinks: {
    display: 'flex',
    gap: '1.25rem',
    flexWrap: 'wrap'
  },
  link: {
    color: 'var(--text-main)',
    textDecoration: 'none',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'color 0.3s',
    cursor: 'pointer'
  },
  authSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  username: {
    color: 'var(--text-main)',
    fontSize: '1rem'
  },
  logoutBtn: {
    padding: '0.5rem 1.25rem',
    backgroundColor: 'var(--danger)',
    color: 'var(--text-main)',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500'
  },
  authButtons: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  loginLink: {
    color: 'var(--text-main)',
    textDecoration: 'none',
    fontSize: '0.95rem',
    padding: '0.5rem 1rem'
  },
  registerBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
    textDecoration: 'none',
    borderRadius: '5px',
    fontSize: '0.95rem',
    fontWeight: '500'
  }
};

export default Navbar;




import type { CSSProperties } from 'react';

export const authFormStyles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
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

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Exercises from './pages/Exercises';
import Workouts from './pages/Workouts';
import ActiveSession from './pages/ActiveSession';
import { cardPatternStyle } from './styles/cardPattern';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.loading}>
        <h2>Učitavanje...</h2>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<Home />} />
        <Route path="/exercises" element={<Exercises />} />
        
        <Route
          path="/workouts"
          element={
            <ProtectedRoute>
              <Workouts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/session"
          element={
            <ProtectedRoute>
              <ActiveSession />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div style={styles.app}>
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  app: {
    ...cardPatternStyle,
    minHeight: '100vh',
    backgroundColor: 'var(--bg-main)'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    color: 'var(--text-main)'
  }
};

export default App;




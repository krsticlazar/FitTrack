import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { WorkoutSession } from '../types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [startingSessionId, setStartingSessionId] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (fetchedRef.current) {
      return;
    }

    fetchedRef.current = true;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        api.getSessionHistory(5, 0),
        api.getStatsOverview()
      ]);

      setRecentSessions(sessionsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes <= 0) {
      return '0 min';
    }

    const hours = Math.floor(minutes / 60);
    const restMinutes = minutes % 60;

    if (hours === 0) {
      return `${restMinutes} min`;
    }

    return `${hours}h ${restMinutes}min`;
  };

  const handleStartFromTemplate = async (session: WorkoutSession) => {
    if (!session.templateId) {
      alert('Ovaj trening nema povezani sablon.');
      return;
    }

    setStartingSessionId(session._id);

    try {
      await api.startSession({ templateId: session.templateId });
      navigate('/session');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Greska pri pokretanju treninga');
    } finally {
      setStartingSessionId(null);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Ucitavanje...</div>;
  }

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.guestCard}>
          <h1 style={styles.title}>FitTrack</h1>
          <p style={styles.subtitle}>
            Kao guest mozete pregledati bazu vezbi, a za kreiranje treninga je potrebna prijava.
          </p>
          <div style={styles.guestActions}>
            <Link to="/exercises" style={styles.guestPrimaryBtn}>
              Pregledaj vezbe
            </Link>
            <Link to="/login" style={styles.guestSecondaryBtn}>
              Prijavi se
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dobrodosli, {user.username}!</h1>
        <p style={styles.subtitle}>Pratite svoj napredak i dostignite svoje ciljeve</p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Ukupno Treninga</h3>
          <p style={styles.statValue}>{stats?.overview?.totalWorkouts || 0}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Ukupan Volumen (kg)</h3>
          <p style={styles.statValue}>{stats?.overview?.totalVolume?.toLocaleString() || 0}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Poslednja 7 dana</h3>
          <p style={styles.statValue}>{stats?.recentWorkouts || 0} treninga</p>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Nedavni Treninzi</h2>
          <Link to="/workouts" style={styles.viewAll}>
            Vidi sve
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div style={styles.emptyState}>
            <p>Jos nema zavrsenih treninga</p>
            <Link to="/workouts" style={styles.startBtn}>
              Pocni prvi trening
            </Link>
          </div>
        ) : (
          <div style={styles.sessionList}>
            {recentSessions.map((session) => (
              <div key={session._id} style={styles.sessionRow}>
                <button
                  type="button"
                  style={styles.sessionCardBtn}
                  onClick={() => setSelectedSession(session)}
                >
                  <div style={styles.sessionCard}>
                    <h3 style={styles.sessionName}>{session.templateName}</h3>
                    <div style={styles.sessionInfo}>
                      <span>{new Date(session.endTime || session.startTime).toLocaleDateString('sr-RS')}</span>
                      <span>{formatDuration(session.duration)}</span>
                      <span>{session.totalVolume} kg</span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartFromTemplate(session)}
                  style={{
                    ...styles.startFromHistoryBtn,
                    ...(!session.templateId ? styles.startFromHistoryBtnDisabled : {})
                  }}
                  disabled={!session.templateId || startingSessionId === session._id}
                >
                  {startingSessionId === session._id ? 'Pokrecem...' : 'Pokreni trening'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedSession && (
        <div style={styles.overlay} onClick={() => setSelectedSession(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setSelectedSession(null)}>
              X
            </button>

            <h2 style={styles.modalTitle}>{selectedSession.templateName}</h2>
            <div style={styles.modalMeta}>
              <span>{new Date(selectedSession.endTime || selectedSession.startTime).toLocaleString('sr-RS')}</span>
              <span>{formatDuration(selectedSession.duration)}</span>
              <span>{selectedSession.totalVolume.toLocaleString()} kg</span>
            </div>

            {selectedSession.notes && <p style={styles.notes}>{selectedSession.notes}</p>}

            <div style={styles.modalExercises}>
              {(selectedSession.exercises || []).map((exercise) => (
                <div key={exercise.exerciseId} style={styles.exerciseCard}>
                  <div style={styles.exerciseHeader}>
                    <img src={exercise.gifUrl} alt={exercise.name} style={styles.exerciseGif} />
                    <div>
                      <h4 style={styles.exerciseName}>{exercise.name}</h4>
                      <span style={styles.exerciseSetsCount}>Setovi: {exercise.sets.length}</span>
                    </div>
                  </div>

                  {exercise.sets.length > 0 ? (
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Set</th>
                          <th style={styles.th}>Tezina</th>
                          <th style={styles.th}>Ponavljanja</th>
                          <th style={styles.th}>Volumen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exercise.sets.map((set) => (
                          <tr key={`${exercise.exerciseId}-${set.setNumber}`}>
                            <td style={styles.td}>{set.setNumber}</td>
                            <td style={styles.td}>{set.weight} kg</td>
                            <td style={styles.td}>{set.reps}</td>
                            <td style={styles.td}>{set.weight * set.reps} kg</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={styles.emptyExerciseState}>Nema unetih setova</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem'
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: 'var(--text-main)'
  },
  header: {
    marginBottom: '3rem'
  },
  guestCard: {
    backgroundColor: 'var(--surface)',
    borderRadius: '10px',
    padding: '3rem',
    marginTop: '2rem',
    textAlign: 'center'
  },
  guestActions: {
    marginTop: '2rem',
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  guestPrimaryBtn: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: '600'
  },
  guestSecondaryBtn: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    border: '1px solid var(--accent)',
    color: 'var(--accent)',
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: '600'
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
    color: 'var(--text-main)'
  },
  subtitle: {
    fontSize: '1.2rem',
    color: 'var(--text-muted)'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem'
  },
  statCard: {
    backgroundColor: 'var(--surface)',
    padding: '2rem',
    borderRadius: '10px',
    textAlign: 'center'
  },
  statTitle: {
    color: 'var(--text-muted)',
    fontSize: '1rem',
    marginBottom: '1rem'
  },
  statValue: {
    color: 'var(--accent)',
    fontSize: '2.5rem',
    fontWeight: 'bold'
  },
  section: {
    marginBottom: '3rem'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  sectionTitle: {
    fontSize: '1.8rem',
    color: 'var(--text-main)'
  },
  viewAll: {
    color: 'var(--accent)',
    textDecoration: 'none',
    fontSize: '1.1rem'
  },
  emptyState: {
    backgroundColor: 'var(--surface)',
    padding: '3rem',
    borderRadius: '10px',
    textAlign: 'center',
    color: 'var(--text-muted)'
  },
  startBtn: {
    display: 'inline-block',
    marginTop: '1rem',
    padding: '0.75rem 2rem',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
    textDecoration: 'none',
    borderRadius: '5px',
    fontWeight: '600'
  },
  sessionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  sessionRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '0.75rem',
    alignItems: 'stretch'
  },
  sessionCardBtn: {
    border: 'none',
    background: 'transparent',
    padding: 0,
    textAlign: 'left',
    cursor: 'pointer'
  },
  sessionCard: {
    backgroundColor: 'var(--surface)',
    padding: '1.5rem',
    borderRadius: '10px',
    border: '1px solid transparent'
  },
  sessionName: {
    color: 'var(--text-main)',
    fontSize: '1.3rem',
    marginBottom: '1rem'
  },
  sessionInfo: {
    display: 'flex',
    gap: '1.5rem',
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    flexWrap: 'wrap'
  },
  startFromHistoryBtn: {
    padding: '0.75rem 1.1rem',
    minWidth: '155px',
    border: 'none',
    borderRadius: '10px',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
    cursor: 'pointer',
    fontWeight: '600'
  },
  startFromHistoryBtnDisabled: {
    backgroundColor: 'var(--surface-3)',
    cursor: 'not-allowed'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  modal: {
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflowY: 'auto',
    backgroundColor: 'var(--surface)',
    borderRadius: '12px',
    padding: '1.5rem',
    position: 'relative'
  },
  closeBtn: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    border: 'none',
    borderRadius: '50%',
    width: '34px',
    height: '34px',
    cursor: 'pointer',
    backgroundColor: 'var(--danger)',
    color: 'var(--text-main)',
    fontWeight: 'bold'
  },
  modalTitle: {
    color: 'var(--text-main)',
    fontSize: '1.7rem',
    marginBottom: '0.75rem',
    paddingRight: '2.5rem'
  },
  modalMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    color: 'var(--text-muted)',
    marginBottom: '1rem'
  },
  notes: {
    color: 'var(--text-muted)',
    marginBottom: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: '0.75rem',
    borderRadius: '8px'
  },
  modalExercises: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  exerciseCard: {
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '1rem',
    backgroundColor: 'var(--surface-2)'
  },
  exerciseHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem'
  },
  exerciseGif: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-main)'
  },
  exerciseName: {
    color: 'var(--text-main)',
    margin: 0,
    marginBottom: '0.2rem',
    textTransform: 'capitalize'
  },
  exerciseSetsCount: {
    color: 'var(--text-muted)',
    fontSize: '0.85rem'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    color: 'var(--text-muted)',
    textAlign: 'left',
    fontSize: '0.85rem',
    padding: '0.45rem 0.25rem',
    borderBottom: '1px solid var(--border)'
  },
  td: {
    color: 'var(--text-main)',
    fontSize: '0.9rem',
    padding: '0.45rem 0.25rem',
    borderBottom: '1px solid var(--border)'
  },
  emptyExerciseState: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    padding: '0.5rem 0'
  }
};

export default Home;



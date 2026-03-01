import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { ExerciseStats, WorkoutSession } from '../types';
import ExerciseCard from '../components/ExerciseCard';

const ActiveSession: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [exerciseStats, setExerciseStats] = useState<Map<string, ExerciseStats>>(new Map());
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const saveInProgressRef = useRef(false);
  const saveQueuedRef = useRef(false);
  const latestExercisesRef = useRef<WorkoutSession['exercises'] | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const sessionRef = useRef<WorkoutSession | null>(null);

  const toSafeNumber = (value: unknown, integer = false): number => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }

    return integer ? Math.floor(parsed) : parsed;
  };

  const sanitizeExercisesForSave = (
    exercises: WorkoutSession['exercises']
  ): WorkoutSession['exercises'] => {
    return exercises.map((exercise) => ({
      ...exercise,
      sets: (exercise.sets || []).map((set, index) => ({
        ...set,
        setNumber:
          Number.isFinite(Number(set.setNumber)) && Number(set.setNumber) > 0
            ? Math.floor(Number(set.setNumber))
            : index + 1,
        weight: toSafeNumber(set.weight),
        reps: toSafeNumber(set.reps, true)
      }))
    }));
  };

  useEffect(() => {
    if (!session) {
      return;
    }

    const interval = setInterval(() => {
      const start = new Date(session.startTime).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - start) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const fetchExerciseStats = useCallback(async (exerciseId: string) => {
    try {
      const response = await api.getExerciseStats(exerciseId);
      setExerciseStats((prev) => new Map(prev).set(exerciseId, response.data));
    } catch (error) {
      console.error('Error fetching exercise stats:', error);
    }
  }, []);

  const fetchActiveSession = useCallback(async () => {
    try {
      const response = await api.getActiveSession();

      if (!response.data) {
        navigate('/workouts');
        return;
      }

      setSession(response.data);
      sessionIdRef.current = response.data._id;

      for (const exercise of response.data.exercises || []) {
        fetchExerciseStats(exercise.exerciseId);
      }
    } catch (error) {
      console.error('Error fetching active session:', error);
      navigate('/workouts');
    } finally {
      setLoading(false);
    }
  }, [fetchExerciseStats, navigate]);

  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  const persistExercises = async (): Promise<void> => {
    if (saveInProgressRef.current) {
      saveQueuedRef.current = true;
      return;
    }

    if (!sessionIdRef.current || !latestExercisesRef.current) {
      return;
    }

    saveInProgressRef.current = true;
    setIsAutoSaving(true);

    try {
      await api.updateSession(sessionIdRef.current, {
        exercises: latestExercisesRef.current
      });
      setAutoSaveError(null);
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveError('Automatsko cuvanje nije uspelo');
    } finally {
      saveInProgressRef.current = false;

      if (saveQueuedRef.current) {
        saveQueuedRef.current = false;
        void persistExercises();
      } else {
        setIsAutoSaving(false);
      }
    }
  };

  const queueAutoSave = (exercises: WorkoutSession['exercises']) => {
    latestExercisesRef.current = sanitizeExercisesForSave(exercises);
    void persistExercises();
  };

  const saveCurrentSessionExercises = () => {
    const currentSession = sessionRef.current;
    if (!currentSession) {
      return;
    }

    sessionIdRef.current = currentSession._id;
    queueAutoSave(currentSession.exercises);
  };

  const addSet = (exerciseIndex: number) => {
    if (!session) {
      return;
    }

    const selected = session.exercises[exerciseIndex];
    if (!selected) {
      return;
    }

    let defaultWeight = 0;
    let defaultReps = 0;

    if (selected.sets.length > 0) {
      const lastSet = selected.sets[selected.sets.length - 1];
      defaultWeight = lastSet.weight;
      defaultReps = lastSet.reps;
    } else {
      const stats = exerciseStats.get(selected.exerciseId);
      if (stats && stats.history.length > 0) {
        defaultWeight = stats.history[0].maxWeight;
        defaultReps = 10;
      }
    }

    const newSet = {
      setNumber: selected.sets.length + 1,
      weight: toSafeNumber(defaultWeight),
      reps: toSafeNumber(defaultReps, true),
      isPersonalRecord: false
    };

    const updatedExercises = session.exercises.map((exercise, index) => {
      if (index !== exerciseIndex) {
        return exercise;
      }

      return {
        ...exercise,
        sets: [...exercise.sets, newSet]
      };
    });

    const updatedSession = {
      ...session,
      exercises: updatedExercises
    };

    setSession(updatedSession);
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'weight' | 'reps',
    value: number
  ) => {
    if (!session) {
      return;
    }

    const selected = session.exercises[exerciseIndex];
    if (!selected) {
      return;
    }

    const stats = exerciseStats.get(selected.exerciseId);

    const updatedExercises = session.exercises.map((exercise, exIndex) => {
      if (exIndex !== exerciseIndex) {
        return exercise;
      }

      const updatedSets = exercise.sets.map((set, currentSetIndex) => {
        if (currentSetIndex !== setIndex) {
          return set;
        }

        const safeValue = toSafeNumber(value, field === 'reps');

        const nextSet = {
          ...set,
          [field]: safeValue
        };

        if (field === 'weight') {
          nextSet.isPersonalRecord = Boolean(
            stats?.personalRecord && safeValue > stats.personalRecord.maxWeight
          );
        }

        return nextSet;
      });

      return {
        ...exercise,
        sets: updatedSets
      };
    });

    const updatedSession = {
      ...session,
      exercises: updatedExercises
    };

    setSession(updatedSession);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    if (!session) {
      return;
    }

    const selected = session.exercises[exerciseIndex];
    if (!selected) {
      return;
    }

    const updatedExercises = session.exercises.map((exercise, exIndex) => {
      if (exIndex !== exerciseIndex) {
        return exercise;
      }

      const updatedSets = exercise.sets
        .filter((_, currentSetIndex) => currentSetIndex !== setIndex)
        .map((set, index) => ({
          ...set,
          setNumber: index + 1
        }));

      return {
        ...exercise,
        sets: updatedSets
      };
    });

    const updatedSession = {
      ...session,
      exercises: updatedExercises
    };

    setSession(updatedSession);
    sessionIdRef.current = session._id;
    queueAutoSave(updatedExercises);
  };

  const completeSession = async () => {
    if (!session) {
      return;
    }

    if (session.exercises.every((exercise) => exercise.sets.length === 0)) {
      alert('Dodajte bar jedan set pre zavrsetka');
      return;
    }

    const confirmed = window.confirm('Da li zelite da zavrsite trening?');
    if (!confirmed) {
      return;
    }

    try {
      await api.updateSession(session._id, {
        exercises: sanitizeExercisesForSave(session.exercises)
      });

      const response = await api.completeSession(session._id);

      if (response.requiresTimeVerification) {
        const duration = response.data.duration;
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;

        const adjust = window.confirm(
          `Trening je trajao ${hours}h ${minutes}min. Da li je ovo tacno vreme?`
        );

        if (!adjust) {
          const newEndTime = prompt('Unesite tacno vreme zavrsetka (format: YYYY-MM-DD HH:MM)');
          if (newEndTime) {
            await api.adjustSessionTime(session._id, newEndTime);
          }
        }
      }

      alert('Trening uspesno zavrsen');
      navigate('/workouts');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Greska pri zavrsavanju');
    }
  };

  const cancelSession = async () => {
    if (!session) {
      return;
    }

    const confirmed = window.confirm('Da li zelite da otkazete trening? Sve ce biti izgubljeno.');
    if (!confirmed) {
      return;
    }

    try {
      await api.deleteSession(session._id);
      navigate('/workouts');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Greska pri otkazivanju');
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div style={styles.loading}>Ucitavanje...</div>;
  }

  if (!session) {
    return null;
  }

  const totalVolume = session.exercises.reduce((total, exercise) => {
    return total + exercise.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
  }, 0);

  const totalSets = session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{session.templateName}</h1>
          <div style={styles.stats}>
            <span>Vreme: {formatTime(elapsedTime)}</span>
            <span>Setovi: {totalSets}</span>
            <span>Volumen: {totalVolume.toLocaleString()} kg</span>
            <span>
              {isAutoSaving
                ? 'Cuvanje...'
                : lastSavedAt
                  ? `Sacuvano: ${lastSavedAt.toLocaleTimeString('sr-RS')}`
                  : 'Auto-save aktivan'}
            </span>
          </div>
          {autoSaveError && <div style={styles.autoSaveError}>{autoSaveError}</div>}
        </div>

        <div style={styles.headerActions}>
          <button onClick={cancelSession} style={styles.cancelBtn}>
            Otkazi
          </button>
          <button onClick={completeSession} style={styles.completeBtn}>
            Zavrsi
          </button>
        </div>
      </div>

      <div style={styles.exercises}>
        {session.exercises.map((exercise, exerciseIndex) => {
          const stats = exerciseStats.get(exercise.exerciseId);
          const maxWeight = stats?.personalRecord?.maxWeight || 0;
          const lastPerformance = stats?.history?.[0];

          return (
            <div key={`${exercise.exerciseId}-${exerciseIndex}`} style={styles.exerciseCard}>
              <div style={styles.exerciseHeader}>
                <div style={styles.exerciseInfo}>
                  <img
                    src={exercise.gifUrl}
                    alt={exercise.name}
                    style={styles.exerciseGif}
                    onClick={() => setSelectedExercise(exercise.exerciseId)}
                  />
                  <div>
                    <h3 style={styles.exerciseName}>{exercise.name}</h3>
                    {maxWeight > 0 && <span style={styles.prBadge}>Rekord: {maxWeight} kg</span>}
                    {lastPerformance && (
                      <div style={styles.lastPerformance}>
                        Poslednji put: {lastPerformance.maxWeight} kg x {lastPerformance.maxReps}
                      </div>
                    )}
                  </div>
                </div>

                <div style={styles.exerciseActions}>
                  <button
                    onClick={() => setSelectedExercise(exercise.exerciseId)}
                    style={styles.infoBtn}
                  >
                    Info
                  </button>
                  <button onClick={() => addSet(exerciseIndex)} style={styles.addSetBtn}>
                    + Dodaj set
                  </button>
                </div>
              </div>

              {exercise.sets.length > 0 ? (
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>Set</th>
                      <th style={styles.th}>Tezina (kg)</th>
                      <th style={styles.th}>Ponavljanja</th>
                      <th style={styles.th}>Volumen</th>
                      <th style={styles.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercise.sets.map((set, setIndex) => (
                      <tr key={`${exercise.exerciseId}-set-${setIndex}`} style={styles.tableRow}>
                        <td style={styles.td}>{set.setNumber}</td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) =>
                              updateSet(
                                exerciseIndex,
                                setIndex,
                                'weight',
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                            style={styles.setInput}
                            step="2.5"
                            min="0"
                            onBlur={saveCurrentSessionExercises}
                          />
                        </td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) =>
                              updateSet(
                                exerciseIndex,
                                setIndex,
                                'reps',
                                Number.parseInt(e.target.value, 10) || 0
                              )
                            }
                            style={styles.setInput}
                            min="0"
                            onBlur={saveCurrentSessionExercises}
                          />
                        </td>
                        <td style={styles.td}>{(set.weight * set.reps).toFixed(0)} kg</td>
                        <td style={styles.td}>
                          <button
                            onClick={() => removeSet(exerciseIndex, setIndex)}
                            style={styles.removeSetBtn}
                          >
                            Obrisi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={styles.emptyState}>Dodajte prvi set</div>
              )}
            </div>
          );
        })}
      </div>

      {selectedExercise && (
        <ExerciseCard exerciseId={selectedExercise} onClose={() => setSelectedExercise(null)} />
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
    color: 'var(--text-main)',
    fontSize: '1.2rem'
  },
  header: {
    backgroundColor: 'var(--surface)',
    padding: '2rem',
    borderRadius: '10px',
    marginBottom: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  title: {
    color: 'var(--text-main)',
    fontSize: '2rem',
    marginBottom: '0.5rem'
  },
  stats: {
    display: 'flex',
    gap: '1.25rem',
    color: 'var(--text-muted)',
    fontSize: '1rem',
    flexWrap: 'wrap'
  },
  autoSaveError: {
    color: 'var(--danger-soft)',
    marginTop: '0.5rem',
    fontSize: '0.9rem'
  },
  headerActions: {
    display: 'flex',
    gap: '1rem'
  },
  cancelBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--danger)',
    color: 'var(--text-main)',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600'
  },
  completeBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--success)',
    color: 'var(--text-main)',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600'
  },
  exercises: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  exerciseCard: {
    backgroundColor: 'var(--surface)',
    borderRadius: '10px',
    padding: '1.5rem'
  },
  exerciseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  exerciseInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  exerciseGif: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  exerciseName: {
    color: 'var(--text-main)',
    fontSize: '1.3rem',
    marginBottom: '0.25rem',
    textTransform: 'capitalize'
  },
  prBadge: {
    color: 'var(--accent-strong)',
    fontSize: '0.9rem',
    fontWeight: '600'
  },
  lastPerformance: {
    marginTop: '0.35rem',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    fontStyle: 'italic'
  },
  exerciseActions: {
    display: 'flex',
    gap: '0.75rem'
  },
  infoBtn: {
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--border)',
    color: 'var(--text-main)',
    border: '1px solid var(--border)',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600'
  },
  addSetBtn: {
    padding: '0.75rem 1.25rem',
    backgroundColor: 'var(--success)',
    color: 'var(--text-main)',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    backgroundColor: 'var(--bg-main)'
  },
  th: {
    padding: '0.75rem',
    color: 'var(--text-muted)',
    textAlign: 'left',
    fontSize: '0.9rem'
  },
  tableRow: {
    borderBottom: '1px solid var(--border)'
  },
  td: {
    padding: '0.75rem',
    color: 'var(--text-main)'
  },
  setInput: {
    width: '100px',
    padding: '0.5rem',
    fontSize: '1rem',
    borderRadius: '5px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-2)',
    color: 'var(--text-main)',
    textAlign: 'center'
  },
  removeSetBtn: {
    padding: '0.35rem 0.65rem',
    backgroundColor: 'var(--surface-3)',
    color: 'var(--danger-soft)',
    border: '1px solid var(--danger)',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.85rem'
  },
  emptyState: {
    padding: '2rem',
    textAlign: 'center',
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-main)',
    borderRadius: '8px'
  }
};

export default ActiveSession;



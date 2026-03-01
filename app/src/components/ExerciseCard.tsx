import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { Exercise } from '../types';
import { toStringArray } from '../utils/toStringArray';

interface ExerciseCardProps {
  exerciseId: string;
  onClose: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exerciseId, onClose }) => {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchExerciseDetails = async () => {
      setLoading(true);
      setExercise(null);

      try {
        const response = await api.getExerciseById(exerciseId);
        const rawExercise = response.data as any;
        const exerciseData = rawExercise?.data || rawExercise;

        if (!isMounted) {
          return;
        }

        setExercise({
          exerciseId: exerciseData?.exerciseId || exerciseId,
          name: exerciseData?.name || '',
          gifUrl: exerciseData?.gifUrl || '',
          targetMuscles: toStringArray(exerciseData?.targetMuscles),
          bodyParts: toStringArray(exerciseData?.bodyParts),
          equipments: toStringArray(exerciseData?.equipments),
          secondaryMuscles: toStringArray(exerciseData?.secondaryMuscles),
          instructions: toStringArray(exerciseData?.instructions)
        });
      } catch (error) {
        console.error('Error fetching exercise details:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchExerciseDetails();

    return () => {
      isMounted = false;
    };
  }, [exerciseId]);

  if (loading) {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={styles.loading}>Učitavanje...</div>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={styles.error}>Greška pri učitavanju vežbe</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        <div style={styles.content}>
          {/* GIF */}
          <div style={styles.gifContainer}>
            <img src={exercise.gifUrl} alt={exercise.name} style={styles.gif} />
          </div>

          {/* Naziv */}
          <h2 style={styles.title}>{exercise.name}</h2>

          {/* Target muscles */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🎯 Glavni mišići</h3>
            <div style={styles.tagContainer}>
              {exercise.targetMuscles.map((muscle, index) => (
                <span key={index} style={styles.primaryTag}>
                  {muscle}
                </span>
              ))}
            </div>
          </div>

          {/* Secondary muscles */}
          {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>💪 Sporedni mišići</h3>
              <div style={styles.tagContainer}>
                {exercise.secondaryMuscles.map((muscle, index) => (
                  <span key={index} style={styles.secondaryTag}>
                    {muscle}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Body parts */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🏋️ Mišićna grupa</h3>
            <div style={styles.tagContainer}>
              {exercise.bodyParts.map((part, index) => (
                <span key={index} style={styles.bodyPartTag}>
                  {part}
                </span>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🔧 Oprema</h3>
            <div style={styles.tagContainer}>
              {exercise.equipments.map((equipment, index) => (
                <span key={index} style={styles.equipmentTag}>
                  {equipment}
                </span>
              ))}
            </div>
          </div>

          {/* Instructions */}
          {exercise.instructions && exercise.instructions.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>📋 Instrukcije</h3>
              <ol style={styles.instructionsList}>
                {exercise.instructions.map((instruction, index) => (
                  <li key={index} style={styles.instructionItem}>
                    {instruction.replace(/^Step:\d+\s*/, '')}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '2rem'
  },
  modal: {
    backgroundColor: 'var(--surface)',
    borderRadius: '15px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
  },
  closeBtn: {
    position: 'sticky',
    top: '1rem',
    left: '100%',
    transform: 'translateX(-1rem)',
    backgroundColor: 'var(--danger)',
    color: 'var(--text-main)',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    fontSize: '1.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    marginBottom: '-40px'
  },
  content: {
    padding: '2rem'
  },
  gifContainer: {
    backgroundColor: 'var(--bg-main)',
    borderRadius: '10px',
    padding: '1rem',
    marginBottom: '1.5rem',
    display: 'flex',
    justifyContent: 'center'
  },
  gif: {
    width: '100%',
    maxWidth: '400px',
    height: 'auto',
    borderRadius: '8px'
  },
  title: {
    color: 'var(--text-main)',
    fontSize: '1.8rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
    textTransform: 'capitalize'
  },
  section: {
    marginBottom: '1.5rem'
  },
  sectionTitle: {
    color: 'var(--text-muted)',
    fontSize: '1.1rem',
    marginBottom: '0.75rem'
  },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem'
  },
  primaryTag: {
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  secondaryTag: {
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--surface-3)',
    color: 'var(--text-main)',
    borderRadius: '20px',
    fontSize: '0.9rem',
    textTransform: 'capitalize'
  },
  bodyPartTag: {
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--success)',
    color: 'var(--text-main)',
    borderRadius: '20px',
    fontSize: '0.9rem',
    textTransform: 'capitalize'
  },
  equipmentTag: {
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--accent-strong)',
    color: 'var(--text-main)',
    borderRadius: '20px',
    fontSize: '0.9rem',
    textTransform: 'capitalize'
  },
  instructionsList: {
    color: 'var(--text-muted)',
    paddingLeft: '1.5rem'
  },
  instructionItem: {
    marginBottom: '0.75rem',
    lineHeight: '1.6'
  },
  loading: {
    padding: '3rem',
    textAlign: 'center',
    color: 'var(--text-main)',
    fontSize: '1.2rem'
  },
  error: {
    padding: '3rem',
    textAlign: 'center',
    color: 'var(--danger)',
    fontSize: '1.2rem'
  }
};

export default ExerciseCard;

import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import type { Exercise } from '../types';
import ExerciseCard from '../components/ExerciseCard';

const Exercises: React.FC = () => {
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchBodyParts();
  }, []);

  const fetchBodyParts = async () => {
    try {
      const response = await api.getBodyParts();
      setBodyParts(response.data);
    } catch (error) {
      console.error('Error fetching body parts:', error);
    }
  };

  const handleBodyPartClick = async (bodyPart: string) => {
    setSelectedBodyPart(bodyPart);
    setLoading(true);
    try {
      const response = await api.getExercisesByBodyPart(bodyPart, 50);
      setExercises(response.data);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Baza Vežbi</h1>
      <p style={styles.subtitle}>Izaberite mišićnu grupu da vidite vežbe</p>

      <div style={styles.bodyPartsGrid}>
        {bodyParts.map((part) => (
          <button
            key={part}
            onClick={() => handleBodyPartClick(part)}
            style={{
              ...styles.bodyPartBtn,
              ...(selectedBodyPart === part ? styles.bodyPartBtnActive : {})
            }}
          >
            {part.toUpperCase()}
          </button>
        ))}
      </div>

      {loading && <div style={styles.loading}>Učitavanje vežbi...</div>}

      {!loading && exercises.length > 0 && (
        <>
          <h2 style={styles.exercisesTitle}>
            Vežbe za: {selectedBodyPart.toUpperCase()} ({exercises.length})
          </h2>
          <div style={styles.exercisesGrid}>
            {exercises.map((exercise) => (
              <div 
                key={exercise.exerciseId} 
                style={styles.exerciseCard}
                onClick={() => setSelectedExercise(exercise.exerciseId)}
              >
                <img
                  src={exercise.gifUrl}
                  alt={exercise.name}
                  style={styles.exerciseGif}
                />
                <h3 style={styles.exerciseName}>{exercise.name}</h3>
                <div style={styles.exerciseTags}>
                  {(exercise.targetMuscles || []).map((muscle, index) => (
                    <span key={index} style={styles.tag}>
                      {muscle}
                    </span>
                  ))}
                </div>
                {/* <div style={styles.exerciseEquipment}>
                  🏋️ {(exercise.equipments || []).join(', ')}
                </div> */}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Exercise Detail Card Modal */}
      {selectedExercise && (
        <ExerciseCard
          exerciseId={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem'
  },
  title: {
    fontSize: '2.5rem',
    color: 'var(--text-main)',
    marginBottom: '0.5rem'
  },
  subtitle: {
    fontSize: '1.2rem',
    color: 'var(--text-muted)',
    marginBottom: '2rem'
  },
  bodyPartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '1rem',
    marginBottom: '3rem'
  },
  bodyPartBtn: {
    padding: '1rem',
    backgroundColor: 'var(--surface)',
    color: 'var(--text-muted)',
    border: '2px solid var(--border)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s'
  },
  bodyPartBtnActive: {
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
    borderColor: 'var(--accent)'
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: 'var(--text-main)',
    fontSize: '1.2rem'
  },
  exercisesTitle: {
    fontSize: '1.8rem',
    color: 'var(--text-main)',
    marginBottom: '2rem'
  },
  exercisesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '2rem'
  },
  exerciseCard: {
    backgroundColor: 'var(--surface)',
    borderRadius: '10px',
    padding: '1.5rem',
    transition: 'transform 0.3s',
    cursor: 'pointer'
  },
  exerciseGif: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginBottom: '1rem',
    backgroundColor: 'var(--surface-2)'
  },
  exerciseName: {
    color: 'var(--text-main)',
    fontSize: '1.2rem',
    marginBottom: '0.75rem'
  },
  exerciseTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '0.75rem'
  },
  tag: {
    padding: '0.25rem 0.75rem',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
    borderRadius: '12px',
    fontSize: '0.85rem'
  },
  exerciseEquipment: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem'
  }
};

export default Exercises;




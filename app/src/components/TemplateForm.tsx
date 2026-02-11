import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { WorkoutTemplate, Exercise, ExerciseInTemplate } from '../types';
import ExerciseCard from './ExerciseCard';

interface TemplateFormProps {
  template?: WorkoutTemplate | null;
  onClose: () => void;
  onSave: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ template, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<ExerciseInTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Exercise picker state
  const [showSearch, setShowSearch] = useState(false);
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState('');
  const [bodyPartExercises, setBodyPartExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setExercises(template.exercises);
    }
    fetchBodyParts();
  }, [template]);

  const fetchBodyParts = async () => {
    try {
      const response = await api.getBodyParts();
      setBodyParts(response.data);
    } catch (error) {
      console.error('Error fetching body parts:', error);
    }
  };

  const handleBodyPartSelect = async (bodyPart: string) => {
    setSelectedBodyPart(bodyPart);
    try {
      const response = await api.getExercisesByBodyPart(bodyPart, 50);
      setBodyPartExercises(response.data);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const addExercise = (exercise: Exercise) => {
    const newExercise: ExerciseInTemplate = {
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      gifUrl: exercise.gifUrl,
      targetMuscles: exercise.targetMuscles,
      bodyParts: exercise.bodyParts,
      equipments: exercise.equipments,
      sets: 3,
      defaultWeight: 0,
      order: exercises.length
    };
    setExercises([...exercises, newExercise]);
    setShowSearch(false);
    setBodyPartExercises([]);
    setSelectedBodyPart('');
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExerciseSets = (index: number, sets: number) => {
    const updated = [...exercises];
    updated[index].sets = sets;
    setExercises(updated);
  };

  const updateExerciseWeight = (index: number, weight: number) => {
    const updated = [...exercises];
    updated[index].defaultWeight = weight;
    setExercises(updated);
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= exercises.length) return;

    const updated = [...exercises];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((ex, i) => ex.order = i);
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || exercises.length === 0) {
      alert('Unesite ime i dodajte bar jednu vežbu');
      return;
    }

    setLoading(true);
    try {
      if (template) {
        await api.updateTemplate(template._id, { name, description, exercises });
      } else {
        await api.createTemplate({ name, description, exercises });
      }
      onSave();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Greška pri čuvanju');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
        
        <h2 style={styles.title}>
          {template ? 'Izmeni Šablon' : 'Kreiraj Novi Šablon'}
        </h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Ime treninga</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              placeholder="npr. Push Day, Leg Day..."
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Opis (opciono)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
              placeholder="Kratki opis treninga..."
            />
          </div>

          <div style={styles.exercisesSection}>
            <div style={styles.exercisesHeader}>
              <h3 style={styles.sectionTitle}>Vežbe ({exercises.length})</h3>
              <button
                type="button"
                onClick={() => setShowSearch(!showSearch)}
                style={styles.addBtn}
              >
                {showSearch ? '✕ Zatvori' : '+ Dodaj Vežbu'}
              </button>
            </div>

            {/* Exercise Picker Panel */}
            {showSearch && (
              <div style={styles.searchPanel}>
                <div style={styles.bodyPartsGrid}>
                  {bodyParts.map((part) => (
                    <button
                      key={part}
                      type="button"
                      onClick={() => handleBodyPartSelect(part)}
                      style={{
                        ...styles.bodyPartBtn,
                        ...(selectedBodyPart === part ? styles.bodyPartBtnActive : {})
                      }}
                    >
                      {part}
                    </button>
                  ))}
                </div>

                <div style={styles.searchResults}>
                  {bodyPartExercises.length > 0 && (
                    <>
                      <h4 style={styles.resultsTitle}>
                        Vežbe za: {selectedBodyPart}
                      </h4>
                      {bodyPartExercises.map((ex) => (
                        <div key={ex.exerciseId} style={styles.searchResultItem}>
                          <img src={ex.gifUrl} alt={ex.name} style={styles.resultGif} />
                          <div style={styles.resultInfo}>
                            <span style={styles.resultName}>{ex.name}</span>
                            <span style={styles.resultMuscle}>
                              {(ex.targetMuscles || []).join(', ')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedExercise(ex.exerciseId)}
                            style={styles.infoBtn}
                          >
                            ℹ️
                          </button>
                          <button
                            type="button"
                            onClick={() => addExercise(ex)}
                            style={styles.selectBtn}
                          >
                            + Dodaj
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Exercise List */}
            {exercises.length === 0 ? (
              <div style={styles.emptyState}>
                <p>Dodajte vežbe u trening</p>
              </div>
            ) : (
              <div style={styles.exercisesList}>
                {exercises.map((exercise, index) => (
                  <div key={index} style={styles.exerciseItem}>
                    <div style={styles.exerciseOrder}>
                      <button
                        type="button"
                        onClick={() => moveExercise(index, 'up')}
                        disabled={index === 0}
                        style={styles.moveBtn}
                      >
                        ▲
                      </button>
                      <span>{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => moveExercise(index, 'down')}
                        disabled={index === exercises.length - 1}
                        style={styles.moveBtn}
                      >
                        ▼
                      </button>
                    </div>

                    <img
                      src={exercise.gifUrl}
                      alt={exercise.name}
                      style={styles.exerciseItemGif}
                    />

                    <div style={styles.exerciseItemInfo}>
                      <span style={styles.exerciseItemName}>{exercise.name}</span>
                      <span style={styles.exerciseItemMuscle}>
                        {(exercise.targetMuscles || []).join(', ')}
                      </span>
                    </div>

                    <div style={styles.exerciseItemControls}>
                      <div style={styles.controlGroup}>
                        <label style={styles.controlLabel}>Setovi:</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={exercise.sets}
                          onChange={(e) => updateExerciseSets(index, parseInt(e.target.value))}
                          style={styles.controlInput}
                        />
                      </div>
                      <div style={styles.controlGroup}>
                        <label style={styles.controlLabel}>Težina (kg):</label>
                        <input
                          type="number"
                          min="0"
                          step="2.5"
                          value={exercise.defaultWeight}
                          onChange={(e) => updateExerciseWeight(index, parseFloat(e.target.value))}
                          style={styles.controlInput}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeExercise(index)}
                      style={styles.removeBtn}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.formActions}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              Otkaži
            </button>
            <button type="submit" disabled={loading} style={styles.saveBtn}>
              {loading ? 'Čuvam...' : template ? 'Sačuvaj Izmene' : 'Kreiraj Šablon'}
            </button>
          </div>
        </form>

        {/* Exercise Detail Modal */}
        {selectedExercise && (
          <ExerciseCard
            exerciseId={selectedExercise}
            onClose={() => setSelectedExercise(null)}
          />
        )}
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
    padding: '1rem',
    overflowY: 'auto'
  },
  modal: {
    backgroundColor: 'var(--surface)',
    borderRadius: '15px',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '95vh',
    overflow: 'auto',
    position: 'relative',
    margin: '2rem auto'
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
    zIndex: 10,
    marginBottom: '-40px'
  },
  title: {
    color: 'var(--text-main)',
    fontSize: '1.8rem',
    padding: '2rem 2rem 1rem',
    margin: 0
  },
  form: {
    padding: '0 2rem 2rem'
  },
  inputGroup: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    color: 'var(--text-muted)',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    borderRadius: '5px',
    border: '2px solid var(--border)',
    backgroundColor: 'var(--surface-2)',
    color: 'var(--text-main)',
    outline: 'none'
  },
  exercisesSection: {
    marginBottom: '1.5rem'
  },
  exercisesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  sectionTitle: {
    color: 'var(--text-main)',
    fontSize: '1.2rem',
    margin: 0
  },
  addBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--success)',
    color: 'var(--text-main)',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600'
  },
  searchPanel: {
    backgroundColor: 'var(--bg-main)',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem'
  },
  bodyPartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '0.5rem',
    marginBottom: '1rem'
  },
  bodyPartBtn: {
    padding: '0.5rem',
    backgroundColor: 'var(--surface)',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.85rem'
  },
  bodyPartBtnActive: {
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
    borderColor: 'var(--accent)'
  },
  searchResults: {
    maxHeight: '400px',
    overflowY: 'auto'
  },
  resultsTitle: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    marginBottom: '0.5rem'
  },
  searchResultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem',
    backgroundColor: 'var(--surface)',
    borderRadius: '5px',
    marginBottom: '0.5rem'
  },
  resultGif: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '5px'
  },
  resultInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  resultName: {
    color: 'var(--text-main)',
    fontSize: '0.9rem',
    textTransform: 'capitalize'
  },
  resultMuscle: {
    color: 'var(--accent)',
    fontSize: '0.8rem'
  },
  infoBtn: {
    padding: '0.5rem',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  selectBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--success)',
    color: 'var(--text-main)',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap'
  },
  emptyState: {
    padding: '2rem',
    textAlign: 'center',
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-main)',
    borderRadius: '8px'
  },
  exercisesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  exerciseItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: 'var(--bg-main)',
    borderRadius: '8px'
  },
  exerciseOrder: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    alignItems: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.85rem'
  },
  moveBtn: {
    padding: '0.25rem',
    backgroundColor: 'transparent',
    color: 'var(--accent)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem'
  },
  exerciseItemGif: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '5px'
  },
  exerciseItemInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  exerciseItemName: {
    color: 'var(--text-main)',
    fontSize: '1rem',
    textTransform: 'capitalize'
  },
  exerciseItemMuscle: {
    color: 'var(--accent)',
    fontSize: '0.85rem'
  },
  exerciseItemControls: {
    display: 'flex',
    gap: '1rem'
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  controlLabel: {
    color: 'var(--text-muted)',
    fontSize: '0.75rem'
  },
  controlInput: {
    width: '80px',
    padding: '0.5rem',
    fontSize: '0.9rem',
    borderRadius: '5px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-2)',
    color: 'var(--text-main)',
    textAlign: 'center'
  },
  removeBtn: {
    padding: '0.5rem',
    backgroundColor: 'var(--danger)',
    color: 'var(--text-main)',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  formActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border)'
  },
  cancelBtn: {
    padding: '0.75rem 2rem',
    backgroundColor: 'var(--surface-3)',
    color: 'var(--text-main)',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  saveBtn: {
    padding: '0.75rem 2rem',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600'
  }
};

export default TemplateForm;





import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { WorkoutTemplate, WorkoutSession } from '../types';
import TemplateForm from '../components/TemplateForm';

const Workouts: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [templatesRes, activeRes] = await Promise.all([
        api.getTemplates(),
        api.getActiveSession()
      ]);

      setTemplates(templatesRes.data);
      setActiveSession(activeRes.data);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (templateId: string) => {
    try {
      await api.startSession({ templateId });
      navigate('/session');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Greška prilikom pokretanja sesije');
    }
  };

  const handleEditTemplate = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTemplate(null);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingTemplate(null);
    fetchData();
  };

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    const confirmed = window.confirm(`Da li želite da obrišete "${templateName}"?`);
    if (!confirmed) return;

    try {
      await api.deleteTemplate(templateId);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Greška pri brisanju');
    }
  };

  const handleContinueSession = () => {
    navigate('/session');
  };

  const handleCancelSession = async () => {
    if (!activeSession) return;

    const confirmed = window.confirm('Da li želite da otkažete aktivnu sesiju? Sve će biti izgubljeno.');
    if (!confirmed) return;

    try {
      await api.deleteSession(activeSession._id);
      setActiveSession(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Greška pri otkazivanju');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Učitavanje...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Moji Treninzi</h1>
        <button onClick={handleCreateNew} style={styles.createBtn}>
          + Kreiraj Šablon
        </button>
      </div>

      {activeSession && (
        <div style={styles.activeSessionAlert}>
          <div style={styles.alertContent}>
            <div>
              <h3 style={styles.alertTitle}>⏱️ Aktivna sesija u toku</h3>
              <p style={styles.alertText}>{activeSession.templateName}</p>
              <p style={styles.alertSubtext}>
                Započeto: {new Date(activeSession.startTime).toLocaleString('sr-RS')}
              </p>
            </div>
            <div style={styles.alertActions}>
              <button onClick={handleContinueSession} style={styles.continueBtn}>
                Nastavi →
              </button>
              <button onClick={handleCancelSession} style={styles.cancelSessionBtn}>
                Otkaži
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Workout Šabloni ({templates.length})</h2>
        
        {templates.length === 0 ? (
          <div style={styles.emptyState}>
            <p>Još nema kreiranih šablona</p>
            <button onClick={handleCreateNew} style={styles.emptyCreateBtn}>
              Kreiraj prvi šablon
            </button>
          </div>
        ) : (
          <div style={styles.templatesGrid}>
            {templates.map((template) => (
              <div key={template._id} style={styles.templateCard}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.templateName}>{template.name}</h3>
                  <div style={styles.cardActions}>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      style={styles.iconBtn}
                      title="Izmeni"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template._id, template.name)}
                      style={styles.iconBtn}
                      title="Obriši"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <p style={styles.templateDesc}>{template.description}</p>
                
                <div style={styles.templateStats}>
                  <span>💪 {template.exercises.length} vežbi</span>
                  <span>🔢 {template.totalSets} setova</span>
                </div>

                <div style={styles.exercisesList}>
                  {template.exercises.slice(0, 4).map((ex, index) => (
                    <div key={ex.exerciseId} style={styles.exerciseItem}>
                      <span style={styles.exerciseOrder}>{index + 1}.</span>
                      <img src={ex.gifUrl} alt={ex.name} style={styles.exerciseThumb} />
                      <div style={styles.exerciseDetails}>
                        <span style={styles.exerciseItemName}>{ex.name}</span>
                        <span style={styles.exerciseItemSets}>{ex.sets} setova</span>
                      </div>
                    </div>
                  ))}
                  {template.exercises.length > 4 && (
                    <div style={styles.exerciseMore}>
                      +{template.exercises.length - 4} još vežbi
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleStartSession(template._id)}
                  disabled={activeSession !== null}
                  style={{
                    ...styles.startBtn,
                    ...(activeSession ? styles.btnDisabled : {})
                  }}
                >
                  {activeSession ? '▶️ Sesija aktivna' : '▶️ Pokreni trening'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Form Modal */}
      {showForm && (
        <TemplateForm
          template={editingTemplate}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  title: {
    fontSize: '2.5rem',
    color: 'var(--text-main)',
    margin: 0
  },
  createBtn: {
    padding: '0.75rem 2rem',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
    border: 'none',
    borderRadius: '5px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  activeSessionAlert: {
    backgroundColor: 'var(--success)',
    padding: '1.5rem',
    borderRadius: '10px',
    marginBottom: '2rem'
  },
  alertContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  alertTitle: {
    color: 'var(--text-main)',
    marginBottom: '0.5rem',
    fontSize: '1.2rem'
  },
  alertText: {
    color: 'var(--text-main)',
    fontSize: '1.1rem',
    marginBottom: '0.25rem',
    fontWeight: '600'
  },
  alertSubtext: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem'
  },
  alertActions: {
    display: 'flex',
    gap: '1rem'
  },
  continueBtn: {
    padding: '0.75rem 2rem',
    backgroundColor: 'var(--text-main)',
    color: 'var(--success)',
    border: 'none',
    borderRadius: '5px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  cancelSessionBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--danger)',
    color: 'var(--text-main)',
    border: 'none',
    borderRadius: '5px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  section: {
    marginBottom: '3rem'
  },
  sectionTitle: {
    fontSize: '1.8rem',
    color: 'var(--text-main)',
    marginBottom: '1.5rem'
  },
  emptyState: {
    backgroundColor: 'var(--surface)',
    padding: '3rem',
    borderRadius: '10px',
    textAlign: 'center',
    color: 'var(--text-muted)'
  },
  emptyCreateBtn: {
    marginTop: '1rem',
    padding: '0.75rem 2rem',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
    border: 'none',
    borderRadius: '5px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  templatesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '2rem'
  },
  templateCard: {
    backgroundColor: 'var(--surface)',
    padding: '2rem',
    borderRadius: '10px'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem'
  },
  templateName: {
    color: 'var(--text-main)',
    fontSize: '1.5rem',
    margin: 0,
    flex: 1
  },
  cardActions: {
    display: 'flex',
    gap: '0.5rem'
  },
  iconBtn: {
    padding: '0.5rem',
    backgroundColor: 'transparent',
    color: 'var(--accent)',
    border: '1px solid var(--accent)',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
    width: '35px',
    height: '35px'
  },
  templateDesc: {
    color: 'var(--text-muted)',
    marginBottom: '1rem',
    fontSize: '0.95rem',
    minHeight: '40px'
  },
  templateStats: {
    display: 'flex',
    gap: '1.5rem',
    color: 'var(--accent)',
    marginBottom: '1rem',
    fontSize: '0.9rem',
    fontWeight: '600'
  },
  exercisesList: {
    marginBottom: '1.5rem'
  },
  exerciseItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    backgroundColor: 'var(--bg-main)',
    borderRadius: '5px',
    marginBottom: '0.5rem'
  },
  exerciseOrder: {
    color: 'var(--accent)',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    minWidth: '20px'
  },
  exerciseThumb: {
    width: '50px',
    height: '50px',
    objectFit: 'cover',
    borderRadius: '5px'
  },
  exerciseDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  exerciseItemName: {
    color: 'var(--text-main)',
    fontSize: '0.9rem',
    textTransform: 'capitalize'
  },
  exerciseItemSets: {
    color: 'var(--text-muted)',
    fontSize: '0.8rem'
  },
  exerciseMore: {
    color: 'var(--accent)',
    fontSize: '0.85rem',
    textAlign: 'center',
    padding: '0.5rem'
  },
  startBtn: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: 'var(--success)',
    color: 'var(--text-main)',
    border: 'none',
    borderRadius: '5px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  btnDisabled: {
    backgroundColor: 'var(--surface-3)',
    cursor: 'not-allowed'
  }
};

export default Workouts;




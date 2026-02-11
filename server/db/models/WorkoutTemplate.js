const mongoose = require('mongoose');

// Sub-schema za vežbe u template-u
const exerciseInTemplateSchema = new mongoose.Schema({
  exerciseId: {
    type: String,
    required: [true, 'Exercise ID je obavezan']
  },
  name: {
    type: String,
    required: [true, 'Ime vežbe je obavezno']
  },
  gifUrl: {
    type: String,
    required: true
  },
  targetMuscles: [String],
  bodyParts: [String],
  equipments: [String],
  sets: {
    type: Number,
    required: [true, 'Broj setova je obavezan'],
    min: [1, 'Minimum 1 set'],
    max: [20, 'Maksimum 20 setova']
  },
  defaultWeight: {
    type: Number,
    default: 0,
    min: [0, 'Težina ne može biti negativna']
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: false });

const workoutTemplateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Ime treninga je obavezno'],
    trim: true,
    minlength: [2, 'Ime mora imati minimum 2 karaktera'],
    maxlength: [100, 'Ime može imati maksimum 100 karaktera']
  },
  description: {
    type: String,
    maxlength: [500, 'Opis može imati maksimum 500 karaktera'],
    default: ''
  },
  exercises: {
    type: [exerciseInTemplateSchema],
    validate: {
      validator: function(exercises) {
        return exercises.length > 0;
      },
      message: 'Template mora imati bar jednu vežbu'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index za user-specific queries
workoutTemplateSchema.index({ userId: 1, createdAt: -1 });

// Virtual za ukupan broj setova u template-u
workoutTemplateSchema.virtual('totalSets').get(function() {
  const exercises = Array.isArray(this.exercises) ? this.exercises : [];
  return exercises.reduce((total, exercise) => total + (exercise?.sets || 0), 0);
});

// Virtual za ukupan broj vežbi
workoutTemplateSchema.virtual('exerciseCount').get(function() {
  return Array.isArray(this.exercises) ? this.exercises.length : 0;
});

// Pre save hook za ažuriranje updatedAt
workoutTemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Metoda za ažuriranje redosleda vežbi
workoutTemplateSchema.methods.reorderExercises = function(exerciseIds) {
  const exercises = Array.isArray(this.exercises) ? this.exercises : [];
  const exerciseMap = new Map(exercises.map(ex => [ex.exerciseId, ex]));
  this.exercises = exerciseIds
    .map((id, index) => {
      const exercise = exerciseMap.get(id);
      if (exercise) {
        exercise.order = index;
        return exercise;
      }
      return null;
    })
    .filter(ex => ex !== null);
};

module.exports = mongoose.model('WorkoutTemplate', workoutTemplateSchema);


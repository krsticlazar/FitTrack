const mongoose = require('mongoose');

// Sub-schema za pojedinačan set
const setSchema = new mongoose.Schema({
  setNumber: {
    type: Number,
    required: true,
    min: 1
  },
  weight: {
    type: Number,
    required: [true, 'Težina je obavezna'],
    min: [0, 'Težina ne može biti negativna'],
    default: 0
  },
  reps: {
    type: Number,
    required: [true, 'Broj ponavljanja je obavezan'],
    min: [0, 'Broj ponavljanja ne može biti negativan'],
    default: 0
  },
  isPersonalRecord: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Sub-schema za vežbe u sesiji
const exerciseInSessionSchema = new mongoose.Schema({
  exerciseId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  gifUrl: {
    type: String
  },
  sets: {
    type: [setSchema],
    default: []
  },
  notes: {
    type: String,
    maxlength: [500, 'Napomena može imati maksimum 500 karaktera'],
    default: ''
  }
}, { _id: false });

const workoutSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutTemplate',
    required: false, // Može biti null za custom treninge
    index: true
  },
  templateName: {
    type: String,
    required: [true, 'Ime treninga je obavezno'],
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'completed', 'cancelled'],
      message: '{VALUE} nije validan status'
    },
    default: 'active',
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    validate: {
      validator: function(value) {
        // endTime mora biti posle startTime
        return !value || value > this.startTime;
      },
      message: 'Vreme završetka mora biti posle vremena početka'
    }
  },
  exercises: {
    type: [exerciseInSessionSchema],
    default: []
  },
  totalVolume: {
    type: Number,
    default: 0,
    min: 0
  },
  duration: {
    type: Number, // U minutama
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    maxlength: [1000, 'Napomena može imati maksimum 1000 karaktera'],
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes za optimizaciju upita
workoutSessionSchema.index({ userId: 1, status: 1 });
workoutSessionSchema.index({ userId: 1, startTime: -1 });
workoutSessionSchema.index({ userId: 1, templateId: 1 });

// TTL index - automatski briši cancelled sesije starije od 30 dana
workoutSessionSchema.index(
  { createdAt: 1 }, 
  { 
    expireAfterSeconds: 2592000, // 30 dana
    partialFilterExpression: { status: 'cancelled' }
  }
);

// Virtual za trajanje sesije u formatiranom obliku
workoutSessionSchema.virtual('durationFormatted').get(function() {
  if (!this.duration) return '0min';
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
});

// Virtual za ukupan broj setova
workoutSessionSchema.virtual('totalSets').get(function() {
  const exercises = Array.isArray(this.exercises) ? this.exercises : [];
  return exercises.reduce((total, exercise) => {
    const setsCount = Array.isArray(exercise?.sets) ? exercise.sets.length : 0;
    return total + setsCount;
  }, 0);
});

// Metoda za kalkulaciju ukupnog volumena
workoutSessionSchema.methods.calculateTotalVolume = function() {
  let volume = 0;
  const exercises = Array.isArray(this.exercises) ? this.exercises : [];

  exercises.forEach(exercise => {
    const sets = Array.isArray(exercise?.sets) ? exercise.sets : [];
    sets.forEach(set => {
      const weight = Number(set?.weight) || 0;
      const reps = Number(set?.reps) || 0;
      volume += weight * reps;
    });
  });

  this.totalVolume = volume;
  return volume;
};

// Metoda za kalkulaciju trajanja
workoutSessionSchema.methods.calculateDuration = function() {
  if (this.endTime && this.startTime) {
    const durationMs = this.endTime - this.startTime;
    this.duration = Math.round(durationMs / (1000 * 60)); // Konvertuj u minute
  }
  return this.duration;
};

// Metoda za završavanje sesije
workoutSessionSchema.methods.complete = function(endTime = null) {
  this.status = 'completed';
  this.endTime = endTime || new Date();
  this.calculateDuration();
  this.calculateTotalVolume();
};

// Pre save hook
workoutSessionSchema.pre('save', function(next) {
  // Automatski izračunaj volumen ako je sesija completed
  if (this.status === 'completed') {
    this.calculateTotalVolume();
    this.calculateDuration();
  }
  next();
});

// Static metoda za pronalaženje aktivne sesije korisnika
workoutSessionSchema.statics.findActiveSession = function(userId) {
  return this.findOne({ userId, status: 'active' })
    .sort({ startTime: -1 });
};

// Static metoda za history sa paginacijom
workoutSessionSchema.statics.findUserHistory = function(userId, limit = 10, skip = 0) {
  return this.find({ userId, status: 'completed' })
    .sort({ startTime: -1 })
    .limit(limit)
    .skip(skip)
    .select('-__v');
};

module.exports = mongoose.model('WorkoutSession', workoutSessionSchema);

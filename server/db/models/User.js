const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username je obavezan'],
    unique: true,
    trim: true,
    minlength: [3, 'Username mora imati minimum 3 karaktera'],
    maxlength: [30, 'Username može imati maksimum 30 karaktera']
  },
  email: {
    type: String,
    required: [true, 'Email je obavezan'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Unesite validan email']
  },
  password: {
    type: String,
    required: [true, 'Password je obavezan'],
    minlength: [6, 'Password mora imati minimum 6 karaktera'],
    select: false // Ne vraćaj password po defaultu u queries
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  // Virtuals se uključuju u JSON
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Hash password pre save-a
userSchema.pre('save', async function(next) {
  // Samo hashuj ako je password modifikovan
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Metoda za proveru password-a
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual za broj workout templates
userSchema.virtual('workoutTemplates', {
  ref: 'WorkoutTemplate',
  localField: '_id',
  foreignField: 'userId',
  count: true
});

// Virtual za broj workout sessions
userSchema.virtual('workoutSessions', {
  ref: 'WorkoutSession',
  localField: '_id',
  foreignField: 'userId',
  count: true
});

module.exports = mongoose.model('User', userSchema);


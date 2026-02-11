require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db/connection');
const errorHandler = require('./middleware/errorHandler');

// Import ruta
const authRoutes = require('./routes/auth');
const exerciseRoutes = require('./routes/exercises');
const templateRoutes = require('./routes/templates');
const sessionRoutes = require('./routes/sessions');
const statsRoutes = require('./routes/stats');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware za development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'FitTrack API je aktivan',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/stats', statsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta nije pronađena'
  });
});

// Error handler middleware (mora biti poslednji)
app.use(errorHandler);

// Konektuj se na MongoDB i pokreni server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║        FitTrack Server Started            ║
╠═══════════════════════════════════════════╣
║  Port: ${PORT}                               ║
║  Environment: ${process.env.NODE_ENV || 'development'}                 ║
║  MongoDB: Connected                       ║
╚═══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Greška prilikom pokretanja servera:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

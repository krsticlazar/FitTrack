const express = require('express');
const router = express.Router();
const axios = require('axios');

const EXERCISEDB_URL = process.env.EXERCISEDB_API_URL || 'https://exercisedb.dev/api/v1';

// Cache za vežbe (opciono - smanjuje broj API poziva)
let exerciseCache = {
  bodyParts: null,
  lastFetch: null
};

// @route   GET /api/exercises/search
// @desc    Pretraga vežbi po imenu
// @access  Public
router.get('/search', async (req, res, next) => {
  try {
    const { name, limit = 10 } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Parametar name je obavezan'
      });
    }

    const response = await axios.get(`${EXERCISEDB_URL}/exercises/search`, {
      params: { name, limit }
    });

    res.json({
      success: true,
      data: response.data.data || []
    });
  } catch (error) {
    console.error('Exercise search error:', error.message);
    next(error);
  }
});

// @route   GET /api/exercises/bodyparts
// @desc    Lista svih body parts
// @access  Public
router.get('/bodyparts', async (req, res, next) => {
  try {
    // Proveri cache (5 minuta)
    const cacheExpired = !exerciseCache.lastFetch || 
      (Date.now() - exerciseCache.lastFetch > 5 * 60 * 1000);

    if (!exerciseCache.bodyParts || cacheExpired) {
      // Hardkodirane body parts iz ExerciseDB
      exerciseCache.bodyParts = [
        'back', 'cardio', 'chest', 'lower arms', 'lower legs',
        'neck', 'shoulders', 'upper arms', 'upper legs', 'waist'
      ];
      exerciseCache.lastFetch = Date.now();
    }

    res.json({
      success: true,
      data: exerciseCache.bodyParts
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/exercises/bodypart/:bodypart
// @desc    Vežbe po body part-u
// @access  Public
router.get('/bodypart/:bodypart', async (req, res, next) => {
  try {
    const { bodypart } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const response = await axios.get(
      `${EXERCISEDB_URL}/bodyparts/${bodypart}/exercises`,
      {
        params: { limit, offset }
      }
    );

    res.json({
      success: true,
      data: response.data.data || [],
      metadata: response.data.metadata || {}
    });
  } catch (error) {
    console.error('Bodypart exercises error:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Body part nije pronađen'
      });
    }
    
    next(error);
  }
});

// @route   GET /api/exercises/muscle/:muscle
// @desc    Vežbe po mišiću
// @access  Public
router.get('/muscle/:muscle', async (req, res, next) => {
  try {
    const { muscle } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const response = await axios.get(
      `${EXERCISEDB_URL}/muscles/${muscle}/exercises`,
      {
        params: { limit, offset }
      }
    );

    res.json({
      success: true,
      data: response.data.data || [],
      metadata: response.data.metadata || {}
    });
  } catch (error) {
    console.error('Muscle exercises error:', error.message);
    next(error);
  }
});

// @route   GET /api/exercises/:id
// @desc    Detalji o vežbi
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const response = await axios.get(`${EXERCISEDB_URL}/exercises/${id}`);
    const exerciseData = response.data?.data || response.data;

    res.json({
      success: true,
      data: exerciseData
    });
  } catch (error) {
    console.error('Exercise detail error:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Vežba nije pronađena'
      });
    }
    
    next(error);
  }
});

module.exports = router;

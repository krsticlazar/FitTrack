const express = require('express');
const router = express.Router();
const { WorkoutTemplate } = require('../db/models');
const { protect } = require('../middleware/auth');

// @route   GET /api/templates
// @desc    Dobavi sve workout templates korisnika
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const templates = await WorkoutTemplate.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/templates/:id
// @desc    Dobavi specifičan workout template
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const template = await WorkoutTemplate.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Workout template nije pronađen'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/templates
// @desc    Kreiraj novi workout template
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, description, exercises } = req.body;

    // Validacija
    if (!name || !exercises || exercises.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ime i vežbe su obavezni'
      });
    }

    // Dodaj order svakoj vežbi ako već ne postoji
    const exercisesWithOrder = exercises.map((exercise, index) => ({
      ...exercise,
      order: exercise.order !== undefined ? exercise.order : index
    }));

    const template = await WorkoutTemplate.create({
      userId: req.user._id,
      name,
      description: description || '',
      exercises: exercisesWithOrder
    });

    res.status(201).json({
      success: true,
      message: 'Workout template uspešno kreiran',
      data: template
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/templates/:id
// @desc    Ažuriraj workout template
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    let template = await WorkoutTemplate.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Workout template nije pronađen'
      });
    }

    const { name, description, exercises } = req.body;

    // Ažuriraj polja
    if (name) template.name = name;
    if (description !== undefined) template.description = description;
    if (exercises) {
      // Dodaj order ako ne postoji
      template.exercises = exercises.map((exercise, index) => ({
        ...exercise,
        order: exercise.order !== undefined ? exercise.order : index
      }));
    }

    await template.save();

    res.json({
      success: true,
      message: 'Workout template uspešno ažuriran',
      data: template
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/templates/:id
// @desc    Obriši workout template
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const template = await WorkoutTemplate.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Workout template nije pronađen'
      });
    }

    res.json({
      success: true,
      message: 'Workout template uspešno obrisan',
      data: {}
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/templates/:id/exercises/reorder
// @desc    Promeni redosled vežbi u template-u
// @access  Private
router.put('/:id/exercises/reorder', protect, async (req, res, next) => {
  try {
    const { exerciseIds } = req.body;

    if (!exerciseIds || !Array.isArray(exerciseIds)) {
      return res.status(400).json({
        success: false,
        message: 'exerciseIds mora biti niz'
      });
    }

    const template = await WorkoutTemplate.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Workout template nije pronađen'
      });
    }

    // Koristimo custom metodu za reorder
    template.reorderExercises(exerciseIds);
    await template.save();

    res.json({
      success: true,
      message: 'Redosled vežbi uspešno promenjen',
      data: template
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

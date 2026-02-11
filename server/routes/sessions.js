const express = require('express');
const router = express.Router();
const { WorkoutSession, WorkoutTemplate } = require('../db/models');
const { protect } = require('../middleware/auth');

// @route   GET /api/sessions
// @desc    Dobavi sve sesije korisnika
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;

    const query = { userId: req.user._id };
    if (status) {
      query.status = status;
    }

    const sessions = await WorkoutSession.find(query)
      .sort({ startTime: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-__v');

    const total = await WorkoutSession.countDocuments(query);

    res.json({
      success: true,
      count: sessions.length,
      total,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/sessions/active
// @desc    Dobavi aktivnu sesiju korisnika
// @access  Private
router.get('/active', protect, async (req, res, next) => {
  try {
    const activeSession = await WorkoutSession.findActiveSession(req.user._id);

    if (!activeSession) {
      return res.json({
        success: true,
        data: null,
        message: 'Nema aktivne sesije'
      });
    }

    res.json({
      success: true,
      data: activeSession
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/sessions/:id
// @desc    Dobavi specifičnu sesiju
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesija nije pronađena'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/sessions
// @desc    Pokreni novu workout sesiju
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { templateId } = req.body;

    // Proveri da li već postoji aktivna sesija
    const existingActive = await WorkoutSession.findActiveSession(req.user._id);
    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: 'Već postoji aktivna sesija. Završite je pre nego što počnete novu.',
        data: existingActive
      });
    }

    let template = null;
    let sessionData = {
      userId: req.user._id,
      status: 'active',
      startTime: new Date()
    };

    // Ako je templateId prosleđen, učitaj template
    if (templateId) {
      template = await WorkoutTemplate.findOne({
        _id: templateId,
        userId: req.user._id
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Workout template nije pronađen'
        });
      }

      sessionData.templateId = template._id;
      sessionData.templateName = template.name;
      
      // Inicijalizuj vežbe iz template-a
      sessionData.exercises = template.exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        name: ex.name,
        gifUrl: ex.gifUrl,
        sets: [] // Prazni setovi - korisnik će ih popuniti
      }));
    } else {
      // Custom trening bez template-a
      const { templateName, exercises } = req.body;
      
      if (!templateName) {
        return res.status(400).json({
          success: false,
          message: 'Ime treninga je obavezno'
        });
      }

      sessionData.templateName = templateName;
      sessionData.exercises = exercises || [];
    }

    const session = await WorkoutSession.create(sessionData);

    res.status(201).json({
      success: true,
      message: 'Sesija uspešno pokrenuta',
      data: session
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/sessions/:id
// @desc    Ažuriraj sesiju (dodaj setove, izmeni napomene)
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesija nije pronađena'
      });
    }

    if (session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Ne možete menjati završenu sesiju'
      });
    }

    const { exercises, notes } = req.body;

    if (exercises !== undefined) {
      session.exercises = exercises;
    }
    
    if (notes !== undefined) {
      session.notes = notes;
    }

    await session.save();

    res.json({
      success: true,
      message: 'Sesija uspešno ažurirana',
      data: session
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/sessions/:id/complete
// @desc    Završi workout sesiju
// @access  Private
router.post('/:id/complete', protect, async (req, res, next) => {
  try {
    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesija nije pronađena'
      });
    }

    if (session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Sesija je već završena'
      });
    }

    const { endTime } = req.body;
    
    // Završi sesiju sa custom metodom
    session.complete(endTime ? new Date(endTime) : null);
    
    // Proveri da li je trajanje duže od 2 sata (120 minuta)
    if (session.duration > 120) {
      session.requiresTimeVerification = true;
    }

    await session.save();

    res.json({
      success: true,
      message: 'Sesija uspešno završena',
      data: session,
      requiresTimeVerification: session.duration > 120
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/sessions/:id/adjust-time
// @desc    Prilagodi vreme trajanja sesije
// @access  Private
router.put('/:id/adjust-time', protect, async (req, res, next) => {
  try {
    const { endTime } = req.body;

    if (!endTime) {
      return res.status(400).json({
        success: false,
        message: 'endTime je obavezan'
      });
    }

    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesija nije pronađena'
      });
    }

    session.endTime = new Date(endTime);
    session.calculateDuration();
    await session.save();

    res.json({
      success: true,
      message: 'Vreme uspešno prilagođeno',
      data: session
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/sessions/:id
// @desc    Obriši sesiju
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const session = await WorkoutSession.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesija nije pronađena'
      });
    }

    res.json({
      success: true,
      message: 'Sesija uspešno obrisana',
      data: {}
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/sessions/history
// @desc    Istorija završenih sesija sa paginacijom
// @access  Private
router.get('/history/list', protect, async (req, res, next) => {
  try {
    const { limit = 10, skip = 0 } = req.query;

    const sessions = await WorkoutSession.findUserHistory(
      req.user._id,
      parseInt(limit),
      parseInt(skip)
    );

    const total = await WorkoutSession.countDocuments({
      userId: req.user._id,
      status: 'completed'
    });

    res.json({
      success: true,
      count: sessions.length,
      total,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

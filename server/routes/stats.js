const express = require('express');
const router = express.Router();
const { WorkoutSession } = require('../db/models');
const { protect } = require('../middleware/auth');

// @route   GET /api/stats/overview
// @desc    Opšte statistike korisnika
// @access  Private
router.get('/overview', protect, async (req, res, next) => {
  try {
    // Agregacija za opšte statistike
    const stats = await WorkoutSession.aggregate([
      {
        $match: {
          userId: req.user._id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          totalVolume: { $sum: '$totalVolume' },
          totalDuration: { $sum: '$duration' },
          avgVolume: { $avg: '$totalVolume' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    // Poslednji trening
    const lastWorkout = await WorkoutSession.findOne({
      userId: req.user._id,
      status: 'completed'
    })
      .sort({ endTime: -1 })
      .select('templateName endTime totalVolume duration');

    // Broj treninga u poslednjih 7 dana
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentWorkouts = await WorkoutSession.countDocuments({
      userId: req.user._id,
      status: 'completed',
      endTime: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      data: {
        overview: stats.length > 0 ? stats[0] : {
          totalWorkouts: 0,
          totalVolume: 0,
          totalDuration: 0,
          avgVolume: 0,
          avgDuration: 0
        },
        lastWorkout,
        recentWorkouts
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/stats/exercise/:exerciseId
// @desc    Statistika i rekord za specifičnu vežbu
// @access  Private
router.get('/exercise/:exerciseId', protect, async (req, res, next) => {
  try {
    const { exerciseId } = req.params;

    // Pronađi sve sesije koje sadrže tu vežbu
    const sessions = await WorkoutSession.find({
      userId: req.user._id,
      status: 'completed',
      'exercises.exerciseId': exerciseId
    })
      .sort({ endTime: -1 })
      .select('exercises endTime templateName');

    if (sessions.length === 0) {
      return res.json({
        success: true,
        data: {
          exerciseId,
          hasData: false,
          personalRecord: null,
          history: []
        }
      });
    }

    let maxWeight = 0;
    let maxVolume = 0;
    let maxReps = 0;
    let prSession = null;

    const history = sessions.map(session => {
      const exercise = session.exercises.find(ex => ex.exerciseId === exerciseId);
      
      if (!exercise) return null;

      const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
      if (sets.length === 0) return null;

      // Kalkulacija za ovu sesiju
      const sessionMaxWeight = Math.max(...sets.map(s => s.weight));
      const sessionMaxReps = Math.max(...sets.map(s => s.reps));
      const sessionVolume = sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);

      // Ažuriraj rekorde
      if (sessionMaxWeight > maxWeight) {
        maxWeight = sessionMaxWeight;
        prSession = {
          weight: sessionMaxWeight,
          date: session.endTime,
          sessionName: session.templateName
        };
      }

      if (sessionVolume > maxVolume) {
        maxVolume = sessionVolume;
      }

      if (sessionMaxReps > maxReps) {
        maxReps = sessionMaxReps;
      }

      return {
        date: session.endTime,
        templateName: session.templateName,
        sets: sets.length,
        maxWeight: sessionMaxWeight,
        maxReps: sessionMaxReps,
        volume: sessionVolume
      };
    }).filter(h => h !== null);

    if (history.length === 0) {
      return res.json({
        success: true,
        data: {
          exerciseId,
          hasData: false,
          personalRecord: null,
          history: []
        }
      });
    }

    res.json({
      success: true,
      data: {
        exerciseId,
        hasData: true,
        personalRecord: {
          maxWeight,
          maxVolume,
          maxReps,
          prSession
        },
        totalSessions: history.length,
        history: history.slice(0, 10) // Poslednjih 10 sesija
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/stats/volume-trend
// @desc    Trend volumena kroz vreme
// @access  Private
router.get('/volume-trend', protect, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const trend = await WorkoutSession.aggregate([
      {
        $match: {
          userId: req.user._id,
          status: 'completed',
          endTime: { $gte: startDate }
        }
      },
      {
        $project: {
          date: {
            $dateToString: { format: '%Y-%m-%d', date: '$endTime' }
          },
          totalVolume: 1,
          duration: 1
        }
      },
      {
        $group: {
          _id: '$date',
          volume: { $sum: '$totalVolume' },
          workouts: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: trend.map(t => ({
        date: t._id,
        volume: t.volume,
        workouts: t.workouts,
        avgDuration: Math.round(t.avgDuration)
      }))
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/stats/records
// @desc    Sve personalne rekorde
// @access  Private
router.get('/records', protect, async (req, res, next) => {
  try {
    // Pronađi sve vežbe iz završenih sesija
    const sessions = await WorkoutSession.find({
      userId: req.user._id,
      status: 'completed'
    }).select('exercises endTime templateName');

    const exerciseRecords = new Map();

    sessions.forEach(session => {
      session.exercises.forEach(exercise => {
        if (exercise.sets.length === 0) return;

        const maxWeight = Math.max(...exercise.sets.map(s => s.weight));
        const maxVolume = exercise.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);

        if (!exerciseRecords.has(exercise.exerciseId)) {
          exerciseRecords.set(exercise.exerciseId, {
            exerciseId: exercise.exerciseId,
            name: exercise.name,
            maxWeight,
            maxVolume,
            lastPerformed: session.endTime,
            sessionName: session.templateName
          });
        } else {
          const current = exerciseRecords.get(exercise.exerciseId);
          
          if (maxWeight > current.maxWeight) {
            current.maxWeight = maxWeight;
            current.sessionName = session.templateName;
            current.lastPerformed = session.endTime;
          }

          if (maxVolume > current.maxVolume) {
            current.maxVolume = maxVolume;
          }

          if (session.endTime > current.lastPerformed) {
            current.lastPerformed = session.endTime;
          }
        }
      });
    });

    const records = Array.from(exerciseRecords.values())
      .sort((a, b) => b.maxWeight - a.maxWeight);

    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;




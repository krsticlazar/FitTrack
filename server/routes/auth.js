const express = require('express');
const router = express.Router();
const { User } = require('../db/models');
const { protect, generateToken } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Registracija novog korisnika
// @access  Public
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Validacija input-a
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Molimo popunite sva polja'
      });
    }

    // Proveri da li korisnik već postoji
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: userExists.email === email 
          ? 'Email već postoji' 
          : 'Username već postoji'
      });
    }

    // Kreiraj korisnika
    const user = await User.create({
      username,
      email,
      password
    });

    // Generiši token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Korisnik uspešno registrovan',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Login korisnika
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validacija
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Molimo unesite email i password'
      });
    }

    // Pronađi korisnika i uključi password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Nevalidni kredencijali'
      });
    }

    // Proveri password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Nevalidni kredencijali'
      });
    }

    // Generiši token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Uspešno logovanje',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Dobavi trenutnog korisnika
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

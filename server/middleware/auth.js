const jwt = require('jsonwebtoken');
const { User } = require('../db/models');

// Middleware za zaštitu ruta - provera JWT tokena
const protect = async (req, res, next) => {
  let token;

  // Proveri da li postoji Authorization header sa Bearer tokenom
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Izvuci token iz header-a
      token = req.headers.authorization.split(' ')[1];

      // Verifikuj token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Dodaj korisnika u req objekat (bez password-a)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Korisnik ne postoji'
        });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token je istekao'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Neautorizovani pristup - nevažeći token'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Neautorizovani pristup - nema tokena'
    });
  }
};

// Helper funkcija za generisanje JWT tokena
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d' // Token važi 30 dana
  });
};

module.exports = { protect, generateToken };

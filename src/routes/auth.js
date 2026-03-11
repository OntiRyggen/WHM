const express = require('express');
const { AuthenticationService } = require('../services/AuthenticationService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const authService = new AuthenticationService();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required'
      });
    }
    
    const result = await authService.authenticate(username, password);
    
    res.json({
      success: true,
      token: result.token,
      user: result.user
    });
  } catch (error) {
    if (error.name === 'AuthenticationError') {
      return res.status(401).json({
        error: 'Authentication failed',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;

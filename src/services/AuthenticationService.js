const jwt = require('jsonwebtoken');
const { findUserByUsername, updateLastLogin, verifyPassword } = require('../models/User');

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

class TokenExpiredError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TokenExpiredError';
    this.statusCode = 401;
  }
}

class InvalidTokenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidTokenError';
    this.statusCode = 401;
  }
}

class AuthenticationService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiration = process.env.JWT_EXPIRATION || '8h';
    this.sessionTimeoutHours = parseInt(process.env.SESSION_TIMEOUT_HOURS || '8');
  }

  async authenticate(username, password) {
    const user = await findUserByUsername(username);
    
    if (!user) {
      throw new AuthenticationError('Invalid username or password');
    }
    
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid username or password');
    }
    
    await updateLastLogin(user.id);
    
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        lastActivity: new Date().toISOString()
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiration }
    );

    
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };
  }

  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      
      if (this.isSessionExpired(new Date(decoded.lastActivity))) {
        throw new TokenExpiredError('Session has expired after 8 hours of inactivity');
      }
      
      return {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
        lastActivity: decoded.lastActivity
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw error;
      }
      if (error.name === 'JsonWebTokenError') {
        throw new InvalidTokenError('Invalid token');
      }
      if (error.name === 'TokenExpiredError' && error.message.includes('jwt expired')) {
        throw new TokenExpiredError('Token has expired');
      }
      throw error;
    }
  }

  isSessionExpired(lastActivity) {
    const now = new Date();
    const lastActivityDate = new Date(lastActivity);
    const hoursSinceActivity = (now - lastActivityDate) / (1000 * 60 * 60);
    
    return hoursSinceActivity >= this.sessionTimeoutHours;
  }
}

module.exports = {
  AuthenticationService,
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError
};

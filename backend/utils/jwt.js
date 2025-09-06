const jwt = require('jsonwebtoken');
const { authConfig } = require('../config/auth');

// Generate access token
const generateAccessToken = (payload) => {
  try {
    const tokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(tokenPayload, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.expiresIn,
      algorithm: authConfig.jwt.algorithm,
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience,
    });
  } catch (error) {
    throw new Error('Failed to generate access token');
  }
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  try {
    const tokenPayload = {
      userId: payload.userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(tokenPayload, authConfig.jwt.refreshSecret, {
      expiresIn: authConfig.jwt.refreshExpiresIn,
      algorithm: authConfig.jwt.algorithm,
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience,
    });
  } catch (error) {
    throw new Error('Failed to generate refresh token');
  }
};

// Verify access token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, authConfig.jwt.secret, {
      algorithms: [authConfig.jwt.algorithm],
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    if (error.name === 'NotBeforeError') {
      throw new Error('Token not active');
    }
    throw new Error('Token verification failed');
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, authConfig.jwt.refreshSecret, {
      algorithms: [authConfig.jwt.algorithm],
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    if (error.name === 'NotBeforeError') {
      throw new Error('Refresh token not active');
    }
    throw new Error('Refresh token verification failed');
  }
};

// Decode token without verification (useful for getting token info)
const decodeToken = (token) => {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    throw new Error('Failed to decode token');
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Get token expiration time
const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

// Get time until token expires (in seconds)
const getTimeUntilExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return 0;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - currentTime);
  } catch (error) {
    return 0;
  }
};

// Extract user ID from token
const getUserIdFromToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded ? decoded.userId : null;
  } catch (error) {
    return null;
  }
};

// Create token pair (access + refresh)
const createTokenPair = (payload, deviceInfo = {}) => {
  try {
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Calculate expiration times
    const accessTokenExpires = new Date(
      Date.now() + parseExpirationTime(authConfig.jwt.expiresIn),
    );
    const refreshTokenExpires = new Date(
      Date.now() + parseExpirationTime(authConfig.jwt.refreshExpiresIn),
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: parseExpirationTime(authConfig.jwt.expiresIn) / 1000, // in seconds
      accessTokenExpires,
      refreshTokenExpires,
      deviceInfo,
    };
  } catch (error) {
    throw new Error('Failed to create token pair');
  }
};

// Parse expiration time string to milliseconds
const parseExpirationTime = (expirationString) => {
  const timeUnits = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  const match = expirationString.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Invalid expiration format');
  }

  const [, amount, unit] = match;
  return parseInt(amount) * timeUnits[unit];
};

// Validate token structure
const validateTokenStructure = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Try to decode header and payload
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Check required fields
    if (!header.alg || !header.typ) {
      return false;
    }

    if (!payload.iat || !payload.exp) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

// Extract device information from request
const extractDeviceInfo = (req) => {
  return {
    userAgent: req.get('User-Agent') || 'Unknown',
    ip: req.ip || req.connection.remoteAddress || 'Unknown',
    platform: req.get('X-Platform') || 'Web',
  };
};

// Generate password reset token
const generatePasswordResetToken = (userId) => {
  try {
    const payload = {
      userId,
      type: 'password_reset',
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, authConfig.jwt.secret, {
      expiresIn: '1h', // Password reset tokens expire in 1 hour
      algorithm: authConfig.jwt.algorithm,
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience,
    });
  } catch (error) {
    throw new Error('Failed to generate password reset token');
  }
};

// Verify password reset token
const verifyPasswordResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, authConfig.jwt.secret, {
      algorithms: [authConfig.jwt.algorithm],
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience,
    });

    if (decoded.type !== 'password_reset') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Password reset token expired');
    }
    throw new Error('Invalid password reset token');
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  getTimeUntilExpiration,
  getUserIdFromToken,
  createTokenPair,
  parseExpirationTime,
  validateTokenStructure,
  extractDeviceInfo,
  generatePasswordResetToken,
  verifyPasswordResetToken,
};

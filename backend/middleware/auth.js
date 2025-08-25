const jwt = require("jsonwebtoken");
const { getAuth, requireAuth } = require("@clerk/express");
const mongoose = require("mongoose");
const User = require("../models/User");
const { AppError } = require("./errorHandler");

// JWT and authentication configuration
const authConfig = {
  // JWT Settings
  jwt: {
    secret:
      process.env.JWT_SECRET || "fallback_secret_key_change_in_production",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      "fallback_refresh_secret_change_in_production",
    expiresIn: process.env.JWT_EXPIRE || "24h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
    algorithm: "HS256",
    issuer: "sokol-learning-platform",
    audience: "sokol-users",
  },

  // Password requirements
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },

  // Session settings
  session: {
    maxActiveSessions: 5, // Maximum concurrent sessions per user
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    refreshTokenRotation: true, // Whether to rotate refresh tokens
  },

  // Account security
  security: {
    maxLoginAttempts: 5,
    lockoutTime: 15 * 60 * 1000, // 15 minutes in milliseconds
    passwordResetExpiry: 60 * 60 * 1000, // 1 hour in milliseconds
    emailVerificationExpiry: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },

  // Learning profile defaults
  learningDefaults: {
    learningStyle: "balanced", // visual, auditory, kinesthetic, reading, balanced
    preferredPace: "medium", // slow, medium, fast
    optimalSessionDuration: 45, // minutes
    aiPersonality: "ARIA", // ARIA, SAGE, COACH
    adaptiveMode: true,
    voiceEnabled: false,
    notificationSettings: {
      learningReminders: true,
      achievementNotifications: true,
      weeklyProgress: true,
      aiInsights: true,
    },
  },

  // Token payload structure
  tokenPayload: {
    includeUserRole: true,
    includeLearningProfile: false, // Keep tokens lightweight
    includePermissions: true,
  },
};

// Validate configuration on startup
const validateAuthConfig = () => {
  const errors = [];

  // Check required environment variables
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters long");
  }

  if (
    !process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_REFRESH_SECRET.length < 32
  ) {
    errors.push("JWT_REFRESH_SECRET must be at least 32 characters long");
  }

  // Validate password requirements
  if (authConfig.password.minLength < 8) {
    errors.push("Minimum password length should be at least 8 characters");
  }

  // Validate session settings
  if (authConfig.session.maxActiveSessions < 1) {
    errors.push("Maximum active sessions must be at least 1");
  }

  if (errors.length > 0) {
    console.error("❌ Authentication configuration errors:");
    errors.forEach((error) => console.error(`  - ${error}`));

    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid authentication configuration");
    }
  }

  console.log("✅ Authentication configuration validated successfully");
};

// Helper functions
const getJWTOptions = (type = "access") => {
  const baseOptions = {
    algorithm: authConfig.jwt.algorithm,
    issuer: authConfig.jwt.issuer,
    audience: authConfig.jwt.audience,
  };

  if (type === "access") {
    return {
      ...baseOptions,
      expiresIn: authConfig.jwt.expiresIn,
    };
  } else if (type === "refresh") {
    return {
      ...baseOptions,
      expiresIn: authConfig.jwt.refreshExpiresIn,
    };
  }

  return baseOptions;
};

const getPasswordValidationRules = () => {
  return {
    minLength: authConfig.password.minLength,
    maxLength: authConfig.password.maxLength,
    pattern: {
      uppercase: authConfig.password.requireUppercase ? /[A-Z]/ : null,
      lowercase: authConfig.password.requireLowercase ? /[a-z]/ : null,
      numbers: authConfig.password.requireNumbers ? /\d/ : null,
      specialChars: authConfig.password.requireSpecialChars
        ? /[!@#$%^&*(),.?":{}|<>]/
        : null,
    },
  };
};

const getDefaultLearningProfile = () => {
  return { ...authConfig.learningDefaults };
};

// CLERK MIDDLEWARE FUNCTIONS

/**
 * Clerk authentication middleware - requires valid Clerk session
 */
const clerkAuth = requireAuth();

/**
 * Get user from Clerk session and attach to request
 */
const attachClerkUser = async (req, res, next) => {
  try {
    const auth = getAuth(req);
    
    if (!auth || !auth.userId) {
      return next(); // No authentication, continue without user
    }

    // Find user in MongoDB by Clerk ID
    let user = await User.findByClerkId(auth.userId);
    
    if (!user) {
      console.log(`🔄 User not found in MongoDB for Clerk ID: ${auth.userId}, creating new user...`);
      
      try {
        // Get full user data from Clerk API
        const { createClerkClient } = require('@clerk/backend');
        const clerkClient = createClerkClient({ 
          secretKey: process.env.CLERK_SECRET_KEY 
        });
        const clerkUser = await clerkClient.users.getUser(auth.userId);
        
        // Create user in MongoDB using Clerk data with proper defaults
        user = await User.createFromClerk({
          id: clerkUser.id,
          first_name: clerkUser.firstName || 'User',
          last_name: clerkUser.lastName || 'Member', // Ensure minimum 2 characters
          email_addresses: clerkUser.emailAddresses?.map(email => ({
            email_address: email.emailAddress,
            verification: { status: email.verification?.status }
          })),
          profile_image_url: clerkUser.profileImageUrl
        });
        
        console.log(`✅ Successfully created user: ${user._id} for Clerk ID: ${auth.userId}`);
      } catch (createError) {
        console.error('❌ Failed to create user from Clerk data:', createError);
        
        // Create a minimal user as fallback
        user = await User.create({
          clerkUserId: auth.userId,
          email: `fallback-${auth.userId.slice(-8)}@clerk-temp.com`,
          firstName: 'User',
          lastName: 'Member', // Changed to meet 2-character minimum requirement
          clerkSyncStatus: 'pending',
          lastClerkSync: new Date()
        });
        
        console.log(`⚠️ Created fallback user: ${user._id}`);
      }
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: "Account inactive",
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // Update last active timestamp
    user.statistics.lastActiveAt = new Date();
    await user.save();

    // Attach user data to request
    req.userId = user._id;
    req.clerkUserId = auth.userId;
    req.userEmail = user.email;
    req.userRole = user.role;
    req.user = user;

    next();
  } catch (error) {
    console.error("Clerk user attachment error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication failed",
      message: "An error occurred during authentication.",
    });
  }
};

/**
 * Combined Clerk authentication middleware
 */
const authenticateWithClerk = async (req, res, next) => {
  // Dev bypass for local testing (no Clerk token needed)
  try {
    if (process.env.NODE_ENV !== 'production' && (req.headers['x-dev-auth'] === 'true')) {
      req.userId = req.userId || 'dev-user-id';
      req.clerkUserId = req.clerkUserId || 'dev-user-id';
      req.userRole = req.userRole || 'user';
      req.user = req.user || { _id: 'dev-user-id', isActive: true };
      return next();
    }
  } catch (_) {}

  // First require Clerk authentication
  const clerkMiddleware = requireAuth();

  clerkMiddleware(req, res, async (error) => {
    if (error) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "Please sign in to access this resource.",
      });
    }

    // If DB not connected yet, fall back to lightweight identity so
    // non-DB endpoints (e.g., AI helpers) can still work
    try {
      if (mongoose.connection.readyState !== 1) {
        const auth = getAuth(req);
        if (auth?.userId) {
          req.userId = auth.userId;
          req.clerkUserId = auth.userId;
          req.userRole = req.userRole || "user";
          req.user = req.user || { _id: auth.userId, isActive: true };
          return next();
        }
      }
    } catch (_) {
      // ignore and attempt full attach below
    }

    // Then attach user data via database if available
    await attachClerkUser(req, res, next);
  });
};

// LEGACY JWT MIDDLEWARE FUNCTIONS

/**
 * Authentication middleware - requires valid JWT token (legacy)
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Access denied. No token provided.",
        message: "Please provide a valid authentication token.",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      const decoded = jwt.verify(token, authConfig.jwt.secret, {
        algorithms: [authConfig.jwt.algorithm],
        issuer: authConfig.jwt.issuer,
        audience: authConfig.jwt.audience,
      });

      // Verify user still exists and is active
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: "User account not found or inactive",
          message: "Please login again.",
        });
      }

      // Add user info to request
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
      req.userRole = decoded.role;
      req.user = user; // Add full user object for convenience

      next();
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          error: "Token expired",
          message: "Your session has expired. Please login again.",
        });
      }
      if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          error: "Invalid token",
          message: "Invalid authentication token. Please login again.",
        });
      }
      if (jwtError.name === "NotBeforeError") {
        return res.status(401).json({
          success: false,
          error: "Token not active",
          message: "Token is not yet valid. Please try again later.",
        });
      }
      throw jwtError;
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication failed",
      message: "An error occurred during authentication.",
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, authConfig.jwt.secret, {
          algorithms: [authConfig.jwt.algorithm],
          issuer: authConfig.jwt.issuer,
          audience: authConfig.jwt.audience,
        });

        // Verify user still exists and is active
        const user = await User.findById(decoded.userId);
        if (user && user.isActive) {
          req.userId = decoded.userId;
          req.userEmail = decoded.email;
          req.userRole = decoded.role;
          req.user = user;
        }
      } catch (jwtError) {
        // For optional auth, we don't return errors, just continue without auth
        console.log("Optional auth failed:", jwtError.message);
      }
    }

    next();
  } catch (error) {
    // For optional auth, continue even if there's an error
    console.error("Optional authentication error:", error);
    next();
  }
};

/**
 * Refresh token validation middleware
 */
const validateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: "Refresh token required",
        message: "Refresh token is required for token renewal.",
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, authConfig.jwt.refreshSecret, {
        algorithms: [authConfig.jwt.algorithm],
        issuer: authConfig.jwt.issuer,
        audience: authConfig.jwt.audience,
      });

      if (decoded.type !== "refresh") {
        return res.status(401).json({
          success: false,
          error: "Invalid token type",
          message: "Token is not a valid refresh token.",
        });
      }

      // Find user and validate refresh token exists in database
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: "User not found or inactive",
          message: "User account not found or has been deactivated.",
        });
      }

      const tokenData = user.refreshTokens.find(
        (t) =>
          t.token === refreshToken && t.isActive && t.expiresAt > new Date()
      );

      if (!tokenData) {
        return res.status(401).json({
          success: false,
          error: "Invalid or expired refresh token",
          message:
            "Refresh token is invalid or has expired. Please login again.",
        });
      }

      req.user = user;
      req.refreshToken = refreshToken;
      next();
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          error: "Refresh token expired",
          message: "Refresh token has expired. Please login again.",
        });
      }
      if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          error: "Invalid refresh token",
          message: "Invalid refresh token format. Please login again.",
        });
      }
      throw jwtError;
    }
  } catch (error) {
    console.error("Refresh token validation error:", error);
    return res.status(500).json({
      success: false,
      error: "Token validation failed",
      message: "An error occurred during token validation.",
    });
  }
};

/**
 * Authorization middleware for checking resource ownership
 */
const authorizeOwnership = (paramName = "id") => {
  return (req, res, next) => {
    const resourceUserId = req.params[paramName];
    const currentUserId = req.userId?.toString();

    // Admin users can access any resource
    if (req.userRole === "admin") {
      return next();
    }

    // Users can only access their own resources
    if (resourceUserId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
        message: "You can only access your own resources.",
      });
    }

    next();
  };
};

/**
 * Role-based authorization middleware
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "Please login to access this resource.",
      });
    }

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
        message: `Access denied. Required roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

/**
 * Rate limiting by user ID
 */
const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    const userId = req.userId;
    if (!userId) {
      return next(); // Skip rate limiting for unauthenticated requests
    }

    const now = Date.now();
    const userKey = userId.toString();

    if (!userRequests.has(userKey)) {
      userRequests.set(userKey, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const userLimit = userRequests.get(userKey);

    if (now > userLimit.resetTime) {
      userLimit.count = 1;
      userLimit.resetTime = now + windowMs;
      return next();
    }

    if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: "Too many requests",
        message: `Rate limit exceeded. Try again in ${Math.ceil(
          (userLimit.resetTime - now) / 1000
        )} seconds.`,
      });
    }

    userLimit.count++;
    next();
  };
};

// Initialize configuration validation
if (process.env.NODE_ENV !== "test") {
  validateAuthConfig();
}

module.exports = {
  // Configuration
  authConfig,
  getJWTOptions,
  getPasswordValidationRules,
  getDefaultLearningProfile,
  validateAuthConfig,

  // Clerk middleware functions
  clerkAuth,
  attachClerkUser,
  authenticateWithClerk,

  // Legacy JWT middleware functions
  authenticate,
  optionalAuth,
  validateRefreshToken,
  authorizeOwnership,
  authorizeRoles,
  rateLimitByUser,
};

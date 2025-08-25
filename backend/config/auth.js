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

// Initialize configuration validation
if (process.env.NODE_ENV !== "test") {
  validateAuthConfig();
}

module.exports = {
  authConfig,
  getJWTOptions,
  getPasswordValidationRules,
  getDefaultLearningProfile,
  validateAuthConfig,
};

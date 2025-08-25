const express = require("express");
const router = express.Router();

// Import middleware
const { authenticate, validateRefreshToken } = require("../middleware/auth");
const {
  validateRegistration,
  validateLogin,
  validatePasswordChange,
  validateRefreshToken: validateRefreshTokenBody,
  validateMongoId,
} = require("../middleware/validation");

// Import controllers
const {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getCurrentUser,
  changePassword,
  requestPasswordReset,
  verifyEmail,
  resendEmailVerification,
  getUserSessions,
  revokeSession,
} = require("../controllers/authController");

// Public routes (no authentication required)

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post("/register", validateRegistration, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get tokens
 * @access  Public
 */
router.post("/login", validateLogin, login);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
  "/refresh-token",
  validateRefreshTokenBody,
  validateRefreshToken,
  refreshToken
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post("/forgot-password", requestPasswordReset);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email address with token
 * @access  Public
 */
router.get("/verify-email/:token", verifyEmail);

// Protected routes (authentication required)

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get("/me", authenticate, getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (revoke refresh token)
 * @access  Private
 */
router.post("/logout", authenticate, logout);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout user from all devices
 * @access  Private
 */
router.post("/logout-all", authenticate, logoutAll);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  "/change-password",
  authenticate,
  validatePasswordChange,
  changePassword
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification
 * @access  Private
 */
router.post("/resend-verification", authenticate, resendEmailVerification);

/**
 * @route   GET /api/auth/sessions
 * @desc    Get user active sessions
 * @access  Private
 */
router.get("/sessions", authenticate, getUserSessions);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Revoke specific session
 * @access  Private
 */
router.delete(
  "/sessions/:sessionId",
  authenticate,
  validateMongoId,
  revokeSession
);

// Health check for auth routes
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authentication service is healthy",
    timestamp: new Date().toISOString(),
    endpoints: {
      public: [
        "POST /api/auth/register",
        "POST /api/auth/login",
        "POST /api/auth/refresh-token",
        "POST /api/auth/forgot-password",
        "GET /api/auth/verify-email/:token",
      ],
      private: [
        "GET /api/auth/me",
        "POST /api/auth/logout",
        "POST /api/auth/logout-all",
        "POST /api/auth/change-password",
        "POST /api/auth/resend-verification",
        "GET /api/auth/sessions",
        "DELETE /api/auth/sessions/:sessionId",
      ],
    },
  });
});

module.exports = router;

const User = require('../models/User');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { extractDeviceInfo } = require('../utils/jwt');
const { getDefaultLearningProfile } = require('../config/auth');

// Register new user
const register = catchAsync(async (req, res) => {
  const { firstName, lastName, email, password, timezone, preferredLanguage } =
    req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Get device information for token tracking
  const deviceInfo = extractDeviceInfo(req);

  // Create new user with default learning profile
  const user = new User({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase(),
    password,
    timezone: timezone || 'UTC',
    preferredLanguage: preferredLanguage || 'en',
    learningProfile: getDefaultLearningProfile(),
    statistics: {
      totalLoginCount: 0,
      totalLearningTime: 0,
      pathsEnrolled: 0,
      pathsCompleted: 0,
      certificatesEarned: 0,
    },
  });

  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken(deviceInfo);

  // Save user
  await user.save();

  // Update login statistics
  user.statistics.totalLoginCount = 1;
  user.statistics.lastLoginAt = new Date();
  user.statistics.lastActiveAt = new Date();
  await user.save();

  console.log(`✅ New user registered: ${email}`);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: {
      user: user.toSafeObject(),
      tokens: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: '24h',
      },
    },
  });
});

// Login user
const login = catchAsync(async (req, res) => {
  const { email, password, rememberMe = false } = req.body;

  // Find user by credentials (this method handles password validation and login attempts)
  const user = await User.findByCredentials(email.toLowerCase(), password);

  // Check if account is active
  if (!user.isActive) {
    throw new AppError('Account is deactivated. Please contact support.', 401);
  }

  // Get device information for token tracking
  const deviceInfo = extractDeviceInfo(req);

  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken(deviceInfo);

  // Update login statistics
  user.statistics.totalLoginCount = (user.statistics.totalLoginCount || 0) + 1;
  user.statistics.lastLoginAt = new Date();
  user.statistics.lastActiveAt = new Date();

  await user.save();

  console.log(`✅ User logged in: ${email}`);

  // Set secure cookie for refresh token if "remember me" is selected
  if (rememberMe) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toSafeObject(),
      tokens: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: '24h',
      },
    },
  });
});

// Refresh access token
const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken: token } = req.body;

  // Find user and validate refresh token
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if refresh token exists and is active
  const tokenData = user.refreshTokens.find(
    (t) => t.token === token && t.isActive && t.expiresAt > new Date(),
  );

  if (!tokenData) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  // Generate new tokens
  const newAccessToken = user.generateAccessToken();

  // Optionally rotate refresh token
  let newRefreshToken = token;
  if (process.env.REFRESH_TOKEN_ROTATION === 'true') {
    const deviceInfo = extractDeviceInfo(req);
    newRefreshToken = user.generateRefreshToken(deviceInfo);

    // Deactivate old refresh token
    user.revokeRefreshToken(token);
  }

  // Update last active timestamp
  user.statistics.lastActiveAt = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: '24h',
      },
    },
  });
});

// Logout user
const logout = catchAsync(async (req, res) => {
  const { refreshToken: token } = req.body;

  // Find user
  const user = await User.findById(req.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Revoke the specific refresh token
  if (token) {
    user.revokeRefreshToken(token);
    await user.save();
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  console.log(`✅ User logged out: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// Logout from all devices
const logoutAll = catchAsync(async (req, res) => {
  // Find user
  const user = await User.findById(req.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Revoke all refresh tokens
  user.revokeAllRefreshTokens();
  await user.save();

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  console.log(`✅ User logged out from all devices: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Logged out from all devices successfully',
  });
});

// Get current user (from token)
const getCurrentUser = catchAsync(async (req, res) => {
  // User is already attached to req by auth middleware
  const user = await User.findById(req.userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Update last active timestamp
  user.statistics.lastActiveAt = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      user: user.toSafeObject(),
    },
  });
});

// Change password
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password field
  const user = await User.findById(req.userId).select('+password');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Check if new password is different from current
  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    throw new AppError(
      'New password must be different from current password',
      400,
    );
  }

  // Update password
  user.password = newPassword;

  // Revoke all refresh tokens for security
  user.revokeAllRefreshTokens();

  await user.save();

  console.log(`✅ Password changed for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message:
      'Password changed successfully. Please login again with your new password.',
  });
});

// Request password reset (placeholder for future implementation)
const requestPasswordReset = catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return success to prevent email enumeration
  res.status(200).json({
    success: true,
    message:
      'If an account with that email exists, a password reset link has been sent.',
  });

  // Only proceed if user exists
  if (!user) {
    return;
  }

  // TODO: Generate password reset token and send email
  console.log(`📧 Password reset requested for: ${email}`);
});

// Verify email (placeholder for future implementation)
const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.params;

  // TODO: Implement email verification logic
  res.status(200).json({
    success: true,
    message: 'Email verification will be implemented in a future update.',
  });
});

// Resend email verification (placeholder for future implementation)
const resendEmailVerification = catchAsync(async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.isEmailVerified) {
    throw new AppError('Email is already verified', 400);
  }

  // TODO: Generate new verification token and send email
  console.log(`📧 Email verification resent for: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Verification email sent. Please check your inbox.',
  });
});

// Get user sessions (active refresh tokens)
const getUserSessions = catchAsync(async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const activeSessions = user.refreshTokens
    .filter((token) => token.isActive && token.expiresAt > new Date())
    .map((token) => ({
      id: token._id,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      deviceInfo: token.deviceInfo,
      isCurrentSession: token.token === req.body.currentRefreshToken,
    }));

  res.status(200).json({
    success: true,
    data: {
      sessions: activeSessions,
      totalSessions: activeSessions.length,
    },
  });
});

// Revoke specific session
const revokeSession = catchAsync(async (req, res) => {
  const { sessionId } = req.params;

  const user = await User.findById(req.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Find and deactivate the session
  const session = user.refreshTokens.id(sessionId);
  if (!session) {
    throw new AppError('Session not found', 404);
  }

  session.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Session revoked successfully',
  });
});

module.exports = {
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
};

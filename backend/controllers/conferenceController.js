const Conference = require('../models/Conference');
const { AppError, catchAsync } = require('../middleware/errorHandler');

/**
 * @route   POST /api/conferences
 * @desc    Create a new conference
 * @access  Private (requires authentication)
 */
const createConference = catchAsync(async (req, res) => {
  const { id, hasPassword, pin, createdBy } = req.body;
  
  // Log what we received
  console.log('Conference creation request body:', {
    id,
    hasPassword,
    hasPin: !!pin,
    createdBy,
    reqAuthUserId: req.auth?.userId,
    reqUserId: req.userId
  });
  
  // Prioritize createdBy from request body (frontend sends Clerk user ID)
  // If not provided, try auth, otherwise default to anonymous
  const userId = createdBy || req.auth?.userId || req.userId || 'anonymous';
  
  console.log('Conference creation - Final userId:', userId);

  if (!id) {
    throw new AppError('Conference ID is required', 400);
  }

  // Validate PIN if password is required
  if (hasPassword) {
    if (!pin || !/^\d{4}$/.test(pin)) {
      throw new AppError('PIN must be exactly 4 digits', 400);
    }
  }

  // Check if conference already exists
  const existingConference = await Conference.findByConferenceId(id);
  if (existingConference) {
    throw new AppError('Conference with this ID already exists', 409);
  }

  // Create conference
  const conferenceData = {
    id,
    hasPassword: hasPassword || false,
    createdBy: userId,
    status: 'active',
    startedAt: new Date(),
  };

  // Only add PIN if password protection is enabled
  if (hasPassword && pin) {
    conferenceData.pin = pin;
  }

  console.log('Creating conference with data:', { ...conferenceData, pin: hasPassword ? '***' : undefined });
  console.log('ConferenceData createdBy before save:', conferenceData.createdBy);

  const conference = await Conference.create(conferenceData);
  
  console.log('Conference createdBy after save:', conference.createdBy);
  
  console.log('Conference created successfully:', { 
    id: conference.id, 
    hasPassword: conference.hasPassword,
    createdBy: conference.createdBy 
  });

  res.status(201).json({
    success: true,
    data: {
      conference: {
        id: conference.id,
        hasPassword: conference.hasPassword,
        // Don't send PIN in response for security
        createdBy: conference.createdBy,
        status: conference.status,
        startedAt: conference.startedAt,
      },
    },
  });
  
  console.log('Conference response sent with createdBy:', conference.createdBy);
});

/**
 * @route   DELETE /api/conferences/:id
 * @desc    End/Delete a conference
 * @access  Private (requires authentication)
 */
const deleteConference = catchAsync(async (req, res) => {
  const { id } = req.params;
  // Optional: get userId if available (but not required)
  const userId = req.auth?.userId || req.userId;

  const conference = await Conference.findByConferenceId(id);

  if (!conference) {
    throw new AppError('Conference not found', 404);
  }

  // If userId is provided, verify it matches the creator (optional check)
  if (userId && userId !== 'anonymous' && conference.createdBy !== userId) {
    throw new AppError('Unauthorized: Only the conference creator can end it', 403);
  }

  // End the conference (soft delete)
  await conference.endConference();

  res.status(200).json({
    success: true,
    message: 'Conference ended successfully',
    data: {
      conference: {
        id: conference.id,
        status: conference.status,
        endedAt: conference.endedAt,
      },
    },
  });
});

/**
 * @route   GET /api/conferences/:id
 * @desc    Get conference details (for PIN verification)
 * @access  Public (for joining)
 */
const getConference = catchAsync(async (req, res) => {
  const { id } = req.params;

  const conference = await Conference.findByConferenceId(id);

  if (!conference) {
    throw new AppError('Conference not found', 404);
  }

  // Return only necessary info (not the PIN)
  res.status(200).json({
    success: true,
    data: {
      conference: {
        id: conference.id,
        hasPassword: conference.hasPassword,
        // PIN is not returned for security
        status: conference.status,
        startedAt: conference.startedAt,
      },
    },
  });
});

/**
 * @route   POST /api/conferences/:id/verify-pin
 * @desc    Verify PIN for protected conference
 * @access  Public
 */
const verifyPin = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { pin } = req.body;

  if (!pin) {
    throw new AppError('PIN is required', 400);
  }

  const conference = await Conference.findByConferenceId(id);

  if (!conference) {
    throw new AppError('Conference not found', 404);
  }

  if (!conference.hasPassword) {
    throw new AppError('This conference does not require a PIN', 400);
  }

  const isValid = conference.verifyPin(pin);

  if (!isValid) {
    throw new AppError('Invalid PIN', 401);
  }

  res.status(200).json({
    success: true,
    message: 'PIN verified successfully',
  });
});

module.exports = {
  createConference,
  deleteConference,
  getConference,
  verifyPin,
};


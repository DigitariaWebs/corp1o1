const Certificate = require('../models/Certificate');
const User = require('../models/User');
const { generateCertificatePDF } = require('../utils/pdfGenerator');
const { AppError, catchAsync } = require('../middleware/errorHandler');

/**
 * Generate a new certificate (public - no auth required)
 * POST /api/certificates/generate
 */
exports.generateCertificate = catchAsync(async (req, res) => {
  const { userName, userId } = req.body;
  
  // Get user name from request body or authenticated user
  let finalUserName = userName;
  let finalUserId = userId;

  // If authenticated, try to get user info
  if (req.userId && req.user) {
    const user = req.user;
    finalUserName = userName || (user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.email?.split('@')[0] || 'User');
    finalUserId = userId || req.userId;
  } else {
    // Public access - userName is required
    if (!userName) {
      throw new AppError('userName is required in request body', 400);
    }
    finalUserName = userName;
    // For public certificates without userId, use null or generate a temp ID
    finalUserId = userId || null;
  }

  // Create certificate record (only credentials saved in DB)
  const certificate = await Certificate.create({
    certificateId: Certificate.generateCertificateId(),
    userId: finalUserId,
    userName: finalUserName,
    dateOfIssue: new Date(),
    status: 'issued',
  });

  res.status(201).json({
    success: true,
    message: 'Certificate generated successfully',
    data: {
      certificate: {
        id: certificate._id,
        certificateId: certificate.certificateId,
        userName: certificate.userName,
        dateOfIssue: certificate.dateOfIssue,
        status: certificate.status,
      },
    },
  });
});

/**
 * Get all certificates (public - no auth required)
 * GET /api/certificates
 */
exports.getCertificates = catchAsync(async (req, res) => {
  const { userId, userName } = req.query;
  const limit = parseInt(req.query.limit) || 50;

  // Build query - filter by userId or userName if provided
  const query = {};
  if (userId) {
    query.userId = userId;
  }
  if (userName) {
    query.userName = userName;
  }

  // If authenticated, default to user's certificates
  if (req.userId && !userId && !userName) {
    query.userId = req.userId;
  }

  const certificates = await Certificate.find(query)
    .sort({ dateOfIssue: -1 })
    .limit(limit)
    .lean();

  res.status(200).json({
    success: true,
    data: {
      certificates: certificates.map(cert => ({
        id: cert._id.toString(),
        certificateId: cert.certificateId,
        userName: cert.userName,
        dateOfIssue: cert.dateOfIssue,
        status: cert.status,
      })),
    },
  });
});

/**
 * Download a certificate PDF (public - no auth required)
 * GET /api/certificates/:id/download
 */
exports.downloadCertificate = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Find certificate by ID (public access - no userId check)
  const certificate = await Certificate.findById(id);

  if (!certificate) {
    throw new AppError('Certificate not found', 404);
  }

  // Generate PDF on-the-fly (no file storage)
  const pdfBuffer = await generateCertificatePDF(
    certificate.userName, 
    certificate.certificateId,
    certificate.dateOfIssue
  );

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificateId}.pdf"`);
  res.send(pdfBuffer);
});

/**
 * Get a specific certificate (public - no auth required)
 * GET /api/certificates/:id
 */
exports.getCertificate = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Find certificate by ID (public access - no userId check)
  const certificate = await Certificate.findById(id);

  if (!certificate) {
    throw new AppError('Certificate not found', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      certificate: {
        id: certificate._id.toString(),
        certificateId: certificate.certificateId,
        userName: certificate.userName,
        dateOfIssue: certificate.dateOfIssue,
        status: certificate.status,
      },
    },
  });
});


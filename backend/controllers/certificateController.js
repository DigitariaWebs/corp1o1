// controllers/certificateController.js
const Certificate = require('../models/Certificate');
const { certificateService } = require('../services/certificateService');
const { AppError, catchAsync } = require('../middleware/errorHandler');

/**
 * Get user's certificates
 * GET /api/certificates
 */
const getUserCertificates = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { type, category, status, isValid, limit = 20, offset = 0 } = req.query;

  console.log(`🏆 Getting certificates for user: ${userId}`);

  const filters = {};
  if (type) filters.type = type;
  if (category) filters.category = category;
  if (status) filters.status = status;
  if (isValid !== undefined) filters.isValid = isValid === 'true';

  const certificates = await certificateService.getUserCertificates(
    userId,
    filters,
  );

  // Apply pagination
  const paginatedCertificates = certificates
    .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
    .map((cert) => ({
      id: cert._id,
      certificateId: cert.certificateId,
      title: cert.title,
      type: cert.type,
      category: cert.category,
      level: cert.level,
      issueDate: cert.issueDate,
      validUntil: cert.validUntil,
      status: cert.status,
      isValid: cert.isValid,
      isExpired: cert.validUntil
        ? new Date(cert.validUntil) < new Date()
        : false,
      finalScore: cert.achievementData?.finalScore,
      skillsVerified: cert.skillsVerified?.length || 0,
      assets: cert.assets,
      verification: {
        verificationCode: cert.verification?.verificationCode,
        verificationUrl: cert.verification?.verificationUrl,
      },
    }));

  res.status(200).json({
    success: true,
    data: {
      certificates: paginatedCertificates,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: certificates.length,
      },
      summary: {
        total: certificates.length,
        byStatus: {
          issued: certificates.filter((c) => c.status === 'issued').length,
          revoked: certificates.filter((c) => c.status === 'revoked').length,
          expired: certificates.filter(
            (c) => c.validUntil && new Date(c.validUntil) < new Date(),
          ).length,
        },
        byType: certificates.reduce((acc, cert) => {
          acc[cert.type] = (acc[cert.type] || 0) + 1;
          return acc;
        }, {}),
        byCategory: certificates.reduce((acc, cert) => {
          acc[cert.category] = (acc[cert.category] || 0) + 1;
          return acc;
        }, {}),
      },
    },
  });
});

/**
 * Get specific certificate details
 * GET /api/certificates/:certificateId
 */
const getCertificateDetails = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { certificateId } = req.params;

  console.log(
    `🔍 Getting certificate details: ${certificateId} for user: ${userId}`,
  );

  const certificate = await Certificate.findOne({
    $or: [{ certificateId }, { _id: certificateId }],
    userId,
  });

  if (!certificate) {
    throw new AppError('Certificate not found', 404);
  }

  // Track view access
  await certificate.trackAccess('view');

  res.status(200).json({
    success: true,
    data: {
      certificate: {
        id: certificate._id,
        certificateId: certificate.certificateId,
        title: certificate.title,
        description: certificate.description,
        type: certificate.type,
        category: certificate.category,
        level: certificate.level,
        recipientName: certificate.recipientName,
        recipientEmail: certificate.recipientEmail,
        issuedBy: certificate.issuedBy,
        issueDate: certificate.issueDate,
        validFrom: certificate.validFrom,
        validUntil: certificate.validUntil,
        status: certificate.status,
        // isValid: certificate.isValid,
        isExpired: certificate.isExpired,
        skillsVerified: certificate.skillsVerified,
        achievementData: certificate.achievementData,
        assets: certificate.assets,
        verification: {
          verificationCode: certificate.verification.verificationCode,
          verificationUrl: certificate.verification.verificationUrl,
          digitalFingerprint: certificate.verification.digitalFingerprint,
        },
        sharing: {
          isPublic: certificate.sharing.isPublic,
          allowSharing: certificate.sharing.allowSharing,
          viewCount: certificate.sharing.viewCount,
          downloadCount: certificate.sharing.downloadCount,
        },
        blockchain: certificate.blockchain?.isBlockchainEnabled
          ? {
            network: certificate.blockchain.network,
            tokenId: certificate.blockchain.tokenId,
            transactionHash: certificate.blockchain.transactionHash,
            nftImageUrl: certificate.blockchain.nftImageUrl,
          }
          : null,
      },
    },
  });
});

/**
 * Download certificate as PDF
 * GET /api/certificates/:certificateId/download
 */
const downloadCertificate = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { certificateId } = req.params;
  const { format = 'pdf' } = req.query;

  console.log(`💾 Downloading certificate: ${certificateId} as ${format}`);

  const certificate = await Certificate.findOne({
    $or: [{ certificateId }, { _id: certificateId }],
    userId,
  });

  if (!certificate) {
    throw new AppError('Certificate not found', 404);
  }

  // Track download access
  await certificate.trackAccess('download');

  // In a real implementation, you would:
  // 1. Generate PDF/image on-demand or serve from storage
  // 2. Set appropriate headers for file download
  // 3. Stream the file content

  res.status(200).json({
    success: true,
    data: {
      downloadUrl: certificate.assets.pdfUrl,
      format,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      message: 'Certificate download prepared',
    },
  });
});

/**
 * Share certificate on social media
 * POST /api/certificates/:certificateId/share
 */
const shareCertificate = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { certificateId } = req.params;
  const { platform, postId, message } = req.body;

  console.log(`📤 Sharing certificate: ${certificateId} on ${platform}`);

  const certificate = await Certificate.findOne({
    $or: [{ certificateId }, { _id: certificateId }],
    userId,
  });

  if (!certificate) {
    throw new AppError('Certificate not found', 404);
  }

  if (!certificate.sharing.allowSharing) {
    throw new AppError('Certificate sharing is not allowed', 403);
  }

  // Track sharing activity
  await certificate.trackShare(platform, postId);

  // In a real implementation, you might:
  // 1. Generate sharing assets optimized for the platform
  // 2. Create sharing URLs with tracking
  // 3. Integrate with social media APIs for direct posting

  res.status(200).json({
    success: true,
    data: {
      shareUrl: certificate.verification.verificationUrl,
      message: `Certificate shared successfully on ${platform}`,
      sharedAt: new Date(),
    },
  });
});

/**
 * Check certificate eligibility for assessment
 * GET /api/certificates/eligible/assessment/:assessmentId
 */
const checkAssessmentCertificateEligibility = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { assessmentId } = req.params;

  console.log(
    `✅ Checking certificate eligibility: Assessment ${assessmentId} for user: ${userId}`,
  );

  const eligibility = await certificateService.checkCertificateEligibility(
    userId,
    assessmentId,
  );

  res.status(200).json({
    success: true,
    data: {
      eligible: eligibility.eligible,
      reason: eligibility.reason,
      assessment: eligibility.assessment
        ? {
          id: eligibility.assessment._id,
          title: eligibility.assessment.title,
          type: eligibility.assessment.type,
          category: eligibility.assessment.category,
          certification: eligibility.assessment.certification,
        }
        : null,
      bestAttempt: eligibility.bestAttempt
        ? {
          sessionId: eligibility.bestAttempt.sessionId,
          finalScore: eligibility.bestAttempt.results.finalScore,
          passed: eligibility.bestAttempt.results.passed,
          completedAt: eligibility.bestAttempt.endTime,
        }
        : null,
    },
  });
});

/**
 * Generate certificate for assessment
 * POST /api/certificates/generate/assessment/:assessmentId
 */
const generateAssessmentCertificate = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { assessmentId } = req.params;
  const options = req.body;

  console.log(
    `🎓 Generating assessment certificate: ${assessmentId} for user: ${userId}`,
  );

  const certificate = await certificateService.generateCertificate(
    userId,
    assessmentId,
    options,
  );

  res.status(201).json({
    success: true,
    data: {
      certificate: certificate.getSummary(),
      message: 'Certificate generated successfully!',
    },
  });
});

/**
 * Generate certificate for learning path completion
 * POST /api/certificates/generate/path/:pathId
 */
const generatePathCertificate = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { pathId } = req.params;
  const options = req.body;

  console.log(`🛤️ Generating path certificate: ${pathId} for user: ${userId}`);

  const certificate =
    await certificateService.generatePathCompletionCertificate(
      userId,
      pathId,
      options,
    );

  res.status(201).json({
    success: true,
    data: {
      certificate: certificate.getSummary(),
      message: 'Path completion certificate generated successfully!',
    },
  });
});

/**
 * Public certificate verification
 * GET /api/certificates/verify/:verificationCode
 */
const verifyCertificate = catchAsync(async (req, res) => {
  const { verificationCode } = req.params;

  console.log(`🔍 Verifying certificate: ${verificationCode}`);

  const verification = await certificateService.verifyCertificate(
    verificationCode,
  );

  if (!verification.valid) {
    res.status(404).json({
      success: false,
      error: verification.reason,
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      valid: true,
      certificate: {
        id: verification.certificate.id,
        certificateId: verification.certificate.certificateId,
        title: verification.certificate.title,
        type: verification.certificate.type,
        category: verification.certificate.category,
        level: verification.certificate.level,
        recipientName: verification.certificate.recipientName,
        issueDate: verification.certificate.issueDate,
        validUntil: verification.certificate.validUntil,
        issuedBy: verification.certificate.issuedBy || {
          organization: 'Sokol Learning Platform',
        },
        skillsVerified: verification.certificate.skillsVerified,
        achievementData: {
          finalScore: verification.certificate.achievementData?.finalScore,
          completionDate:
            verification.certificate.achievementData?.completionDate,
          totalTimeSpent:
            verification.certificate.achievementData?.totalTimeSpent,
        },
      },
      verifiedAt: new Date(),
    },
  });
});

/**
 * Get certificate analytics for user
 * GET /api/certificates/analytics
 */
const getCertificateAnalytics = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { timeRange = '1y' } = req.query;

  console.log(`📊 Getting certificate analytics for user: ${userId}`);

  // Get user's certificates
  const certificates = await Certificate.findUserCertificates(userId);

  // Filter by time range
  const dateThreshold = new Date();
  switch (timeRange) {
  case '30d':
    dateThreshold.setDate(dateThreshold.getDate() - 30);
    break;
  case '90d':
    dateThreshold.setDate(dateThreshold.getDate() - 90);
    break;
  case '1y':
    dateThreshold.setFullYear(dateThreshold.getFullYear() - 1);
    break;
  case 'all':
    dateThreshold.setFullYear(2020); // Far back date
    break;
  }

  const filteredCertificates = certificates.filter(
    (cert) => new Date(cert.issueDate) >= dateThreshold,
  );

  // Calculate analytics
  const analytics = {
    summary: {
      total: certificates.length,
      recent: filteredCertificates.length,
      valid: certificates.filter(
        (c) =>
          c.status === 'issued' &&
          (!c.validUntil || new Date(c.validUntil) > new Date()),
      ).length,
      revoked: certificates.filter((c) => c.status === 'revoked').length,
      expired: certificates.filter(
        (c) => c.validUntil && new Date(c.validUntil) < new Date(),
      ).length,
    },
    byType: this.groupByField(filteredCertificates, 'type'),
    byCategory: this.groupByField(filteredCertificates, 'category'),
    byLevel: this.groupByField(filteredCertificates, 'level'),
    skillsVerified: this.analyzeSkillsVerified(filteredCertificates),
    timeline: this.createTimeline(filteredCertificates, timeRange),
    averageScore: this.calculateAverageScore(filteredCertificates),
  };

  res.status(200).json({
    success: true,
    data: {
      analytics,
      timeRange,
      generatedAt: new Date(),
    },
  });
});

/**
 * Update certificate visibility settings
 * PUT /api/certificates/:certificateId/settings
 */
const updateCertificateSettings = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { certificateId } = req.params;
  const { isPublic, allowSharing } = req.body;

  console.log(`⚙️ Updating certificate settings: ${certificateId}`);

  const certificate = await Certificate.findOne({
    $or: [{ certificateId }, { _id: certificateId }],
    userId,
  });

  if (!certificate) {
    throw new AppError('Certificate not found', 404);
  }

  // Update settings
  if (typeof isPublic === 'boolean') {
    certificate.sharing.isPublic = isPublic;
  }

  if (typeof allowSharing === 'boolean') {
    certificate.sharing.allowSharing = allowSharing;
  }

  await certificate.save();

  res.status(200).json({
    success: true,
    data: {
      message: 'Certificate settings updated successfully',
      settings: {
        isPublic: certificate.sharing.isPublic,
        allowSharing: certificate.sharing.allowSharing,
      },
    },
  });
});

/**
 * Get certificate templates
 * GET /api/certificates/templates
 */
const getCertificateTemplates = catchAsync(async (req, res) => {
  const { category } = req.query;

  console.log(
    `🎨 Getting certificate templates for category: ${category || 'all'}`,
  );

  // In a real implementation, you would fetch templates from database
  const templates = [
    {
      id: 'default_template',
      name: 'Classic Certificate',
      description: 'Traditional certificate design with elegant borders',
      category: 'general',
      previewUrl: '/templates/classic-preview.png',
      colors: {
        primary: '#0066cc',
        secondary: '#f0f8ff',
        background: '#ffffff',
      },
    },
    {
      id: 'leadership_template',
      name: 'Leadership Excellence',
      description: 'Professional template for leadership certifications',
      category: 'Communication & Leadership',
      previewUrl: '/templates/leadership-preview.png',
      colors: {
        primary: '#3b82f6',
        secondary: '#e0e7ff',
        background: '#f8f9ff',
      },
    },
    {
      id: 'creative_template',
      name: 'Creative Arts',
      description:
        'Vibrant template for creativity and innovation certificates',
      category: 'Innovation & Creativity',
      previewUrl: '/templates/creative-preview.png',
      colors: {
        primary: '#a855f7',
        secondary: '#f3e8ff',
        background: '#fef7ff',
      },
    },
    {
      id: 'technical_template',
      name: 'Technical Skills',
      description: 'Modern template for technical skill certifications',
      category: 'Technical Skills',
      previewUrl: '/templates/technical-preview.png',
      colors: {
        primary: '#22c55e',
        secondary: '#dcfce7',
        background: '#f0fdf4',
      },
    },
    {
      id: 'business_template',
      name: 'Business Strategy',
      description: 'Corporate template for business and strategy certificates',
      category: 'Business Strategy',
      previewUrl: '/templates/business-preview.png',
      colors: {
        primary: '#eab308',
        secondary: '#fef3c7',
        background: '#fefce8',
      },
    },
  ];

  const filteredTemplates = category
    ? templates.filter(
      (t) => t.category === category || t.category === 'general',
    )
    : templates;

  res.status(200).json({
    success: true,
    data: {
      templates: filteredTemplates,
      total: filteredTemplates.length,
    },
  });
});

// Helper methods for analytics
function groupByField(certificates, field) {
  const grouped = certificates.reduce((acc, cert) => {
    const value = cert[field] || 'unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped)
    .sort(([, a], [, b]) => b - a)
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
}

function analyzeSkillsVerified(certificates) {
  const skills = {};

  certificates.forEach((cert) => {
    if (cert.skillsVerified) {
      cert.skillsVerified.forEach((skill) => {
        if (!skills[skill.skillName]) {
          skills[skill.skillName] = {
            count: 0,
            averageScore: 0,
            levels: {},
          };
        }

        skills[skill.skillName].count += 1;
        skills[skill.skillName].averageScore += skill.score;
        skills[skill.skillName].levels[skill.level] =
          (skills[skill.skillName].levels[skill.level] || 0) + 1;
      });
    }
  });

  // Calculate averages
  Object.keys(skills).forEach((skillName) => {
    skills[skillName].averageScore = Math.round(
      skills[skillName].averageScore / skills[skillName].count,
    );
  });

  return Object.entries(skills)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10) // Top 10 skills
    .reduce((acc, [skill, data]) => {
      acc[skill] = data;
      return acc;
    }, {});
}

function createTimeline(certificates, timeRange) {
  const timeline = {};

  certificates.forEach((cert) => {
    const date = new Date(cert.issueDate);
    let key;

    switch (timeRange) {
    case '30d':
      key = date.toISOString().split('T')[0]; // Daily
      break;
    case '90d':
    case '1y':
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        '0',
      )}`; // Monthly
      break;
    default:
      key = date.getFullYear().toString(); // Yearly
    }

    timeline[key] = (timeline[key] || 0) + 1;
  });

  return timeline;
}

function calculateAverageScore(certificates) {
  const scores = certificates
    .filter((cert) => cert.achievementData?.finalScore)
    .map((cert) => cert.achievementData.finalScore);

  return scores.length > 0
    ? Math.round(
      (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100,
    ) / 100
    : 0;
}

module.exports = {
  getUserCertificates,
  getCertificateDetails,
  downloadCertificate,
  shareCertificate,
  checkAssessmentCertificateEligibility,
  generateAssessmentCertificate,
  generatePathCertificate,
  verifyCertificate,
  getCertificateAnalytics,
  updateCertificateSettings,
  getCertificateTemplates,

  // Helper methods (exported for testing)
  groupByField,
  analyzeSkillsVerified,
  createTimeline,
  calculateAverageScore,
};

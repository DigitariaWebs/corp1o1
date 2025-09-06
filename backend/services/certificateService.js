// services/certificateService.js
const Certificate = require('../models/Certificate');
const Assessment = require('../models/Assessment');
const AssessmentSession = require('../models/AssessmentSession');
const LearningPath = require('../models/LearningPath');
const UserProgress = require('../models/UserProgress');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

class CertificateService {
  /**
   * Check if user is eligible for certificate based on assessment completion
   * @param {string} userId - User ID
   * @param {string} assessmentId - Assessment ID
   * @returns {Promise<Object>} Eligibility check result
   */
  async checkCertificateEligibility(userId, assessmentId) {
    try {
      console.log(
        `🏆 Checking certificate eligibility: User ${userId}, Assessment ${assessmentId}`,
      );

      // Get assessment
      const assessment = await Assessment.findById(assessmentId).populate(
        'relatedPaths relatedModules',
      );

      if (!assessment) {
        throw new AppError('Assessment not found', 404);
      }

      if (!assessment.certification.issuesCertificate) {
        return {
          eligible: false,
          reason: 'Assessment does not issue certificates',
        };
      }

      // Get user's best attempt
      const bestAttempt = await AssessmentSession.findBestAttempt(
        userId,
        assessmentId,
      );

      if (!bestAttempt) {
        return {
          eligible: false,
          reason: 'No completed assessment attempts found',
        };
      }

      if (!bestAttempt.results.passed) {
        return {
          eligible: false,
          reason: 'Assessment not passed',
        };
      }

      if (
        bestAttempt.results.finalScore < assessment.certification.requiredScore
      ) {
        return {
          eligible: false,
          reason: `Score ${bestAttempt.results.finalScore}% below required ${assessment.certification.requiredScore}%`,
        };
      }

      // Check if certificate already issued
      const existingCertificate = await Certificate.findOne({
        userId,
        'achievementData.assessmentsPassed.assessmentId': assessmentId,
        status: 'issued',
      });

      if (existingCertificate) {
        return {
          eligible: false,
          reason: 'Certificate already issued',
          existingCertificate: existingCertificate.getSummary(),
        };
      }

      return {
        eligible: true,
        assessment,
        bestAttempt,
        reason: 'All requirements met',
      };
    } catch (error) {
      console.error('❌ Error checking certificate eligibility:', error);
      throw error;
    }
  }

  /**
   * Generate certificate for completed assessment
   * @param {string} userId - User ID
   * @param {string} assessmentId - Assessment ID
   * @param {Object} options - Certificate generation options
   * @returns {Promise<Object>} Generated certificate
   */
  async generateCertificate(userId, assessmentId, options = {}) {
    try {
      console.log(
        `📜 Generating certificate: User ${userId}, Assessment ${assessmentId}`,
      );

      // Check eligibility
      const eligibility = await this.checkCertificateEligibility(
        userId,
        assessmentId,
      );

      if (!eligibility.eligible) {
        throw new AppError(
          `Not eligible for certificate: ${eligibility.reason}`,
          400,
        );
      }

      const { assessment, bestAttempt } = eligibility;

      // Get user data
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Generate certificate data
      const certificateData = await this.buildCertificateData(
        user,
        assessment,
        bestAttempt,
        options,
      );

      // Create certificate
      const certificate = new Certificate(certificateData);
      await certificate.save();

      // Generate verification assets
      await certificate.generateVerificationAssets();

      // Generate visual assets
      await this.generateCertificateAssets(certificate);

      // Update user statistics
      await this.updateUserCertificateStats(userId, certificate);

      console.log(`✅ Certificate generated: ${certificate.certificateId}`);

      return certificate;
    } catch (error) {
      console.error('❌ Error generating certificate:', error);
      throw error;
    }
  }

  /**
   * Generate certificate for learning path completion
   * @param {string} userId - User ID
   * @param {string} pathId - Learning path ID
   * @param {Object} options - Certificate options
   * @returns {Promise<Object>} Generated certificate
   */
  async generatePathCompletionCertificate(userId, pathId, options = {}) {
    try {
      console.log(
        `🛤️ Generating path completion certificate: User ${userId}, Path ${pathId}`,
      );

      // Get learning path and user progress
      const [learningPath, pathProgress] = await Promise.all([
        LearningPath.findById(pathId),
        UserProgress.findOne({ userId, pathId, 'progress.completed': true }),
      ]);

      if (!learningPath) {
        throw new AppError('Learning path not found', 404);
      }

      if (!pathProgress) {
        throw new AppError('Learning path not completed', 400);
      }

      // Check if certificate already exists
      const existingCertificate = await Certificate.findOne({
        userId,
        'achievementData.pathsCompleted.pathId': pathId,
        status: 'issued',
      });

      if (existingCertificate) {
        throw new AppError('Certificate already issued for this path', 400);
      }

      // Get user
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Build certificate data for path completion
      const certificateData = await this.buildPathCertificateData(
        user,
        learningPath,
        pathProgress,
        options,
      );

      // Create and save certificate
      const certificate = new Certificate(certificateData);
      await certificate.save();

      // Generate assets
      await certificate.generateVerificationAssets();
      await this.generateCertificateAssets(certificate);

      // Update statistics
      await this.updateUserCertificateStats(userId, certificate);

      console.log(
        `✅ Path completion certificate generated: ${certificate.certificateId}`,
      );

      return certificate;
    } catch (error) {
      console.error('❌ Error generating path certificate:', error);
      throw error;
    }
  }

  /**
   * Build certificate data structure
   * @param {Object} user - User object
   * @param {Object} assessment - Assessment object
   * @param {Object} assessmentSession - Assessment session with results
   * @param {Object} options - Options
   * @returns {Promise<Object>} Certificate data
   */
  async buildCertificateData(user, assessment, assessmentSession, options) {
    // Determine certificate type based on assessment
    const certificateType = this.determineCertificateType(
      assessment,
      assessmentSession.results,
    );

    // Get skill verifications from assessment results
    const skillsVerified = await this.extractSkillVerifications(
      assessment,
      assessmentSession,
    );

    // Build achievement data
    const achievementData = {
      finalScore: assessmentSession.results.finalScore,
      totalTimeSpent: Math.round(
        assessmentSession.results.totalTimeSpent / 3600,
      ), // convert to hours
      completionDate: assessmentSession.endTime,
      pathsCompleted: [], // Will be populated if related paths exist
      assessmentsPassed: [
        {
          assessmentId: assessment._id,
          title: assessment.title,
          score: assessmentSession.results.finalScore,
          attempts: assessmentSession.attemptNumber,
          passedDate: assessmentSession.endTime,
        },
      ],
      additionalAchievements: [],
    };

    // Add related path completions
    for (const relatedPath of assessment.relatedPaths || []) {
      const pathProgress = await UserProgress.findOne({
        userId: user._id,
        pathId: relatedPath._id,
        'progress.completed': true,
      });

      if (pathProgress) {
        achievementData.pathsCompleted.push({
          pathId: relatedPath._id,
          title: relatedPath.title,
          completionDate: pathProgress.progress.completedAt,
          finalScore: pathProgress.performance.averageScore,
        });
      }
    }

    return {
      title: this.generateCertificateTitle(assessment, certificateType),
      description: this.generateCertificateDescription(
        assessment,
        assessmentSession.results,
      ),
      type: certificateType,
      category: assessment.category,
      level: this.determineCertificateLevel(
        assessment,
        assessmentSession.results,
      ),
      userId: user._id,
      recipientName: `${user.firstName} ${user.lastName}`,
      recipientEmail: user.email,
      issuedBy: {
        organization: 'Sokol Learning Platform',
        issuerName: options.issuerName || null,
        issuerId: options.issuerId || null,
      },
      skillsVerified,
      achievementData,
      design: {
        templateId:
          options.templateId || this.selectCertificateTemplate(assessment),
        backgroundColor:
          options.backgroundColor ||
          this.getCategoryColor(assessment.category).background,
        primaryColor:
          options.primaryColor ||
          this.getCategoryColor(assessment.category).primary,
        secondaryColor:
          options.secondaryColor ||
          this.getCategoryColor(assessment.category).secondary,
      },
      tags: [
        assessment.category,
        assessment.type,
        certificateType,
        ...assessment.tags,
      ],
      metadata: {
        credentialType: 'assessment_completion',
        competencyFramework:
          options.competencyFramework || 'Sokol Skills Framework',
        version: '1.0.0',
      },
    };
  }

  /**
   * Build certificate data for learning path completion
   * @param {Object} user - User object
   * @param {Object} learningPath - Learning path object
   * @param {Object} pathProgress - User progress on path
   * @param {Object} options - Options
   * @returns {Promise<Object>} Certificate data
   */
  async buildPathCertificateData(user, learningPath, pathProgress, options) {
    // Get all assessments passed in this path
    const pathAssessments = await AssessmentSession.find({
      userId: user._id,
      assessmentId: { $in: learningPath.assessments || [] },
      'results.passed': true,
    }).populate('assessmentId', 'title');

    // Build skills verified from path modules
    const skillsVerified = await this.extractPathSkillVerifications(
      learningPath,
      pathProgress,
    );

    const achievementData = {
      finalScore: pathProgress.performance.averageScore,
      totalTimeSpent: Math.round((pathProgress.progress.timeSpent || 0) / 60), // convert to hours
      completionDate: pathProgress.progress.completedAt,
      pathsCompleted: [
        {
          pathId: learningPath._id,
          title: learningPath.title,
          completionDate: pathProgress.progress.completedAt,
          finalScore: pathProgress.performance.averageScore,
        },
      ],
      assessmentsPassed: pathAssessments.map((session) => ({
        assessmentId: session.assessmentId._id,
        title: session.assessmentId.title,
        score: session.results.finalScore,
        attempts: session.attemptNumber,
        passedDate: session.endTime,
      })),
      additionalAchievements: [],
    };

    const certificateType = this.determinePathCertificateType(
      learningPath,
      pathProgress,
    );

    return {
      title: `${learningPath.title} - Completion Certificate`,
      description: `Successfully completed the ${learningPath.title} learning path with ${achievementData.finalScore}% average score`,
      type: certificateType,
      category: learningPath.category,
      level: learningPath.difficulty,
      userId: user._id,
      recipientName: `${user.firstName} ${user.lastName}`,
      recipientEmail: user.email,
      issuedBy: {
        organization: 'Sokol Learning Platform',
        issuerName: options.issuerName || null,
        issuerId: options.issuerId || null,
      },
      skillsVerified,
      achievementData,
      design: {
        templateId: options.templateId || 'path_completion',
        backgroundColor:
          options.backgroundColor ||
          this.getCategoryColor(learningPath.category).background,
        primaryColor:
          options.primaryColor ||
          this.getCategoryColor(learningPath.category).primary,
        secondaryColor:
          options.secondaryColor ||
          this.getCategoryColor(learningPath.category).secondary,
      },
      tags: [
        learningPath.category,
        'path_completion',
        certificateType,
        ...learningPath.skills,
      ],
      metadata: {
        credentialType: 'path_completion',
        competencyFramework: 'Sokol Skills Framework',
        version: '1.0.0',
      },
    };
  }

  /**
   * Extract skill verifications from assessment results
   * @param {Object} assessment - Assessment object
   * @param {Object} assessmentSession - Assessment session
   * @returns {Promise<Array>} Skill verifications
   */
  async extractSkillVerifications(assessment, assessmentSession) {
    const skillsVerified = [];

    // Extract skills from assessment questions
    const skillScores = {};

    assessment.questions.forEach((question) => {
      if (question.skills && question.skills.length > 0) {
        question.skills.forEach((skill) => {
          if (!skillScores[skill.name]) {
            skillScores[skill.name] = {
              totalScore: 0,
              totalPossible: 0,
              level: skill.level,
              count: 0,
            };
          }

          const answer = assessmentSession.answers.find(
            (a) => a.questionId === question.questionId,
          );
          if (answer) {
            skillScores[skill.name].totalScore += answer.pointsEarned || 0;
            skillScores[skill.name].totalPossible += answer.maxPoints;
            skillScores[skill.name].count += 1;
          }
        });
      }
    });

    // Convert to skill verifications
    Object.entries(skillScores).forEach(([skillName, scores]) => {
      const percentage =
        scores.totalPossible > 0
          ? (scores.totalScore / scores.totalPossible) * 100
          : 0;

      if (percentage >= 70) {
        // Only verify skills with 70%+ performance
        skillsVerified.push({
          skillName,
          level: this.determineSkillLevel(percentage, scores.level),
          score: Math.round(percentage),
          assessmentId: assessment._id,
          assessmentDate: assessmentSession.endTime,
          verificationMethod: 'assessment',
        });
      }
    });

    return skillsVerified;
  }

  /**
   * Extract skill verifications from learning path completion
   * @param {Object} learningPath - Learning path object
   * @param {Object} pathProgress - User progress
   * @returns {Promise<Array>} Skill verifications
   */
  async extractPathSkillVerifications(learningPath, pathProgress) {
    const skillsVerified = [];

    // Get skills from the learning path
    if (learningPath.skills && learningPath.skills.length > 0) {
      learningPath.skills.forEach((skill) => {
        // Determine skill level based on path completion and performance
        const skillLevel = this.determineSkillLevel(
          pathProgress.performance.averageScore,
          learningPath.difficulty,
        );

        if (pathProgress.performance.averageScore >= 70) {
          skillsVerified.push({
            skillName: skill,
            level: skillLevel,
            score: Math.round(pathProgress.performance.averageScore),
            assessmentId: null, // Path completion, not specific assessment
            assessmentDate: pathProgress.progress.completedAt,
            verificationMethod: 'project', // Learning path completion is project-based
          });
        }
      });
    }

    return skillsVerified;
  }

  /**
   * Generate certificate visual assets (images, PDF)
   * @param {Object} certificate - Certificate object
   * @returns {Promise<void>}
   */
  async generateCertificateAssets(certificate) {
    try {
      console.log(
        `🎨 Generating certificate assets for: ${certificate.certificateId}`,
      );

      // In a real implementation, this would generate actual images and PDFs
      // For now, we'll create placeholder URLs

      const baseUrl =
        process.env.CERTIFICATE_ASSETS_URL || 'https://certificates.sokol.ai';

      certificate.assets.certificateImageUrl = `${baseUrl}/certificates/${certificate.certificateId}.png`;
      certificate.assets.pdfUrl = `${baseUrl}/certificates/${certificate.certificateId}.pdf`;
      certificate.assets.badgeImageUrl = `${baseUrl}/badges/${certificate.certificateId}.png`;

      // In production, you would:
      // 1. Use a service like Puppeteer to generate HTML -> PDF/PNG
      // 2. Use image processing libraries to create custom designs
      // 3. Store assets in cloud storage (AWS S3, Cloudinary, etc.)

      await certificate.save();

      console.log('✅ Certificate assets generated');
    } catch (error) {
      console.error('Error generating certificate assets:', error);
      // Don't throw - certificate can still be valid without visual assets
    }
  }

  /**
   * Revoke a certificate
   * @param {string} certificateId - Certificate ID
   * @param {string} reason - Revocation reason
   * @param {string} revokedBy - User ID who revoked it
   * @returns {Promise<Object>} Revoked certificate
   */
  async revokeCertificate(certificateId, reason, revokedBy) {
    try {
      console.log(`❌ Revoking certificate: ${certificateId}`);

      const certificate = await Certificate.findOne({ certificateId });

      if (!certificate) {
        throw new AppError('Certificate not found', 404);
      }

      if (certificate.status === 'revoked') {
        throw new AppError('Certificate is already revoked', 400);
      }

      await certificate.revoke(reason, revokedBy);

      // Update user statistics
      const user = await User.findById(certificate.userId);
      if (user && user.statistics.certificatesEarned > 0) {
        user.statistics.certificatesEarned -= 1;
        await user.save();
      }

      console.log(`✅ Certificate revoked: ${certificateId}`);

      return certificate;
    } catch (error) {
      console.error('❌ Error revoking certificate:', error);
      throw error;
    }
  }

  /**
   * Verify certificate authenticity
   * @param {string} verificationCode - Certificate verification code
   * @returns {Promise<Object>} Verification result
   */
  async verifyCertificate(verificationCode) {
    try {
      console.log(`🔍 Verifying certificate: ${verificationCode}`);

      const certificate = await Certificate.verifyByCode(verificationCode);

      if (!certificate) {
        return {
          valid: false,
          reason: 'Certificate not found or invalid',
        };
      }

      if (certificate.isExpired) {
        return {
          valid: false,
          reason: 'Certificate has expired',
          certificate: certificate.getSummary(),
        };
      }

      // Track verification access
      await certificate.trackAccess('view');

      return {
        valid: true,
        certificate: {
          ...certificate.getSummary(),
          recipientName: certificate.recipientName,
          issueDate: certificate.issueDate,
          validUntil: certificate.validUntil,
          skillsVerified: certificate.skillsVerified,
          achievementData: certificate.achievementData,
        },
      };
    } catch (error) {
      console.error('❌ Error verifying certificate:', error);
      throw error;
    }
  }

  /**
   * Get user's certificates with filtering options
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} User's certificates
   */
  async getUserCertificates(userId, filters = {}) {
    try {
      const certificates = await Certificate.findUserCertificates(
        userId,
        filters,
      );

      return certificates.map((cert) => ({
        ...cert,
        isValid:
          cert.status === 'issued' &&
          cert.verification?.isVerified &&
          (!cert.validUntil || new Date(cert.validUntil) > new Date()),
      }));
    } catch (error) {
      console.error('Error getting user certificates:', error);
      throw error;
    }
  }

  /**
   * Update user certificate statistics
   * @param {string} userId - User ID
   * @param {Object} certificate - Certificate object
   * @returns {Promise<void>}
   */
  async updateUserCertificateStats(userId, certificate) {
    try {
      const user = await User.findById(userId);
      if (user) {
        user.statistics.certificatesEarned =
          (user.statistics.certificatesEarned || 0) + 1;
        user.statistics.lastCertificateDate = certificate.issueDate;
        await user.save();
      }
    } catch (error) {
      console.error('Error updating user certificate stats:', error);
      // Don't throw - certificate generation shouldn't fail due to stats update
    }
  }

  // Helper methods

  determineCertificateType(assessment, results) {
    if (results.finalScore >= 95) return 'mastery';
    if (results.finalScore >= 90) return 'expert';
    if (assessment.type === 'certification') return 'certification';
    if (assessment.type === 'skill_check') return 'micro_credential';
    return 'completion';
  }

  determinePathCertificateType(learningPath, progress) {
    if (progress.performance.averageScore >= 95) return 'mastery';
    if (progress.performance.averageScore >= 90) return 'expert';
    if (learningPath.difficulty === 'expert') return 'professional';
    return 'completion';
  }

  determineCertificateLevel(assessment, results) {
    if (results.finalScore >= 95) return 'expert';
    if (results.finalScore >= 85) return 'advanced';
    if (results.finalScore >= 70) return 'intermediate';
    return 'beginner';
  }

  determineSkillLevel(score, baseLevel = 'intermediate') {
    const levelMap = {
      beginner: 0,
      intermediate: 1,
      advanced: 2,
      expert: 3,
      master: 4,
    };

    const reverseMap = [
      'beginner',
      'intermediate',
      'advanced',
      'expert',
      'master',
    ];

    let baseIndex = levelMap[baseLevel] || 1;

    if (score >= 95) {
      baseIndex = Math.min(4, baseIndex + 2); // Jump 2 levels for excellent performance
    } else if (score >= 90) {
      baseIndex = Math.min(4, baseIndex + 1); // Jump 1 level for great performance
    } else if (score < 70) {
      baseIndex = Math.max(0, baseIndex - 1); // Drop 1 level for poor performance
    }

    return reverseMap[baseIndex];
  }

  generateCertificateTitle(assessment, certificateType) {
    const typeLabels = {
      completion: 'Completion Certificate',
      mastery: 'Mastery Certificate',
      expert: 'Expert Certificate',
      certification: 'Professional Certification',
      micro_credential: 'Micro-Credential',
      professional: 'Professional Certificate',
    };

    const typeLabel = typeLabels[certificateType] || 'Certificate';
    return `${assessment.title} - ${typeLabel}`;
  }

  generateCertificateDescription(assessment, results) {
    return `Successfully completed ${
      assessment.title
    } assessment with a score of ${
      results.finalScore
    }%. This certificate validates proficiency in ${
      assessment.category
    } skills and demonstrates ${
      results.passed ? 'satisfactory' : 'excellent'
    } understanding of the subject matter.`;
  }

  selectCertificateTemplate(assessment) {
    const templateMap = {
      'Communication & Leadership': 'leadership_template',
      'Innovation & Creativity': 'creative_template',
      'Technical Skills': 'technical_template',
      'Business Strategy': 'business_template',
      'Personal Development': 'personal_template',
      'Data & Analytics': 'analytics_template',
    };

    return templateMap[assessment.category] || 'default_template';
  }

  getCategoryColor(category) {
    const colorMap = {
      'Communication & Leadership': {
        background: '#f8f9ff',
        primary: '#3b82f6',
        secondary: '#e0e7ff',
      },
      'Innovation & Creativity': {
        background: '#fef7ff',
        primary: '#a855f7',
        secondary: '#f3e8ff',
      },
      'Technical Skills': {
        background: '#f0fdf4',
        primary: '#22c55e',
        secondary: '#dcfce7',
      },
      'Business Strategy': {
        background: '#fefce8',
        primary: '#eab308',
        secondary: '#fef3c7',
      },
      'Personal Development': {
        background: '#fff7ed',
        primary: '#f97316',
        secondary: '#fed7aa',
      },
      'Data & Analytics': {
        background: '#f0f9ff',
        primary: '#0ea5e9',
        secondary: '#e0f2fe',
      },
    };

    return (
      colorMap[category] || {
        background: '#f9fafb',
        primary: '#6b7280',
        secondary: '#e5e7eb',
      }
    );
  }
}

// Export singleton instance
const certificateService = new CertificateService();

module.exports = {
  certificateService,
  CertificateService,
};

const express = require('express');
const router = express.Router();

// Import middleware
const { validateMongoId } = require('../middleware/validation');

// Import controllers
const {
  generateCertificate,
  getCertificates,
  getCertificate,
  downloadCertificate,
} = require('../controllers/certificateController');

// Certificate routes are public - no authentication required

/**
 * @route   POST /api/certificates/generate
 * @desc    Generate a new certificate (public - no auth required)
 * @access  Public
 */
router.post('/generate', generateCertificate);

/**
 * @route   GET /api/certificates
 * @desc    Get all certificates (public - no auth required)
 * @access  Public
 */
router.get('/', getCertificates);

/**
 * @route   GET /api/certificates/:id
 * @desc    Get a specific certificate (public - no auth required)
 * @access  Public
 */
router.get('/:id', validateMongoId, getCertificate);

/**
 * @route   GET /api/certificates/:id/download
 * @desc    Download a certificate PDF (public - no auth required)
 * @access  Public
 */
router.get('/:id/download', validateMongoId, downloadCertificate);

module.exports = router;


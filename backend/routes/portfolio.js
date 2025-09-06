const express = require('express');
const router = express.Router();
const {
  getUserPortfolio,
  updatePortfolio,
  getPublicPortfolio,
  addProject,
  updateProject,
  deleteProject,
  addWorkExperience,
  connectExternalPlatform,
  disconnectExternalPlatform,
  getPortfolioAnalytics,
  searchPortfolios,
} = require('../controllers/portfolioController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/search', searchPortfolios);
router.get('/:userId', getPublicPortfolio);

// Protected routes - require authentication
router.use(authenticate);

// Portfolio management
router.get('/', getUserPortfolio);
router.put('/', updatePortfolio);

// Project management
router.post('/projects', addProject);
router.put('/projects/:projectId', updateProject);
router.delete('/projects/:projectId', deleteProject);

// Work experience management
router.post('/experience', addWorkExperience);

// External platform connections
router.post('/connect', connectExternalPlatform);
router.delete('/connect/:platform', disconnectExternalPlatform);

// Analytics
router.get('/analytics', getPortfolioAnalytics);

module.exports = router;
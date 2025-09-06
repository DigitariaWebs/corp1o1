const crypto = require('crypto');

/**
 * Generate unique session ID for learning sessions
 */
const generateSessionId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(8).toString('hex');
  return `session_${timestamp}_${randomStr}`;
};

/**
 * Calculate percentage with proper rounding
 */
const calculatePercentage = (completed, total, decimals = 2) => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Format duration from minutes to human readable string
 */
const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
};

module.exports = {
  generateSessionId,
  calculatePercentage,
  formatDuration,
};
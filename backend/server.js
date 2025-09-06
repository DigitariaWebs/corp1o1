// server.js
require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { connectDatabase } = require('./config/database');
const morgan = require('morgan');
const { clerkMiddleware } = require('@clerk/express');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');   // ✅ Correct
const learningPathRoutes = require('./routes/learningPaths');
const moduleRoutes = require('./routes/modules');
const progressRoutes = require('./routes/progress');
const aiRoutes = require('./routes/ai');
// 🆕 Phase 4 routes
const assessmentRoutes = require('./routes/assessments');
const skillsRoutes = require('./routes/skills');
const certificateRoutes = require('./routes/certificates');
// 🆕 Phase 5 routes (when ready)
const analyticsRoutes = require('./routes/analytics');
const recommendationRoutes = require('./routes/recommendations');
const portfolioRoutes = require('./routes/portfolio');
const personalizationRoutes = require('./routes/personalization');
// 🆕 Onboarding routes
const onboardingRoutes = require('./routes/onboarding');
// 🆕 Webhook routes
const webhookRoutes = require('./routes/webhooks');

const app = express();

// Database connection
(async () => {
  try {
    const conn = await connectDatabase();

    const runPostConnectInit = async () => {
      try {
        // Drop legacy index that causes plan creation failures
        const { dropLegacyAssessmentQuestionIdIndex } = require('./config/database-indexes');
        await dropLegacyAssessmentQuestionIdIndex();
        await initializeAIPrompts();
        await initializeAnalytics();
      } catch (e) {
        console.error('❌ Post-connection initialization failed:', e);
      }
    };

    if (conn && mongoose.connection.readyState === 1) {
      await runPostConnectInit();
    } else {
      mongoose.connection.once('connected', runPostConnectInit);
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
})();

// Initialize AI prompts in database
const initializeAIPrompts = async () => {
  try {
    const AIPrompt = require('./models/AIPrompt');
    const promptCount = await AIPrompt.countDocuments();
    
    if (promptCount === 0) {
      console.log('🤖 Initializing default AI prompts...');
      await AIPrompt.createDefaults();
      console.log('✅ Default AI prompts created');
    } else {
      console.log(`📋 Found ${promptCount} AI prompts in database`);
    }
  } catch (error) {
    console.error('⚠️ Failed to initialize AI prompts:', error);
  }
};

// 🆕 Initialize analytics system
const initializeAnalytics = async () => {
  try {
    const AdaptationRule = require('./models/AdaptationRule');
    const ruleCount = await AdaptationRule.countDocuments();
    
    if (ruleCount === 0) {
      console.log('📊 Initializing default adaptation rules...');
      await AdaptationRule.createDefaults();
      console.log('✅ Default adaptation rules created');
    } else {
      console.log(`📋 Found ${ruleCount} adaptation rules in database`);
    }
    
    // Start background analytics processor
    const { startAnalyticsProcessor } = require('./jobs/analyticsProcessor');
    await startAnalyticsProcessor();
    console.log('🔄 Analytics processor started');
    
  } catch (error) {
    console.error('⚠️ Failed to initialize analytics:', error);
  }
};

// DB connection handled above via connectDatabase()

// Trust proxy (for rate limiting behind load balancer)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      scriptSrc: ['\'self\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
      connectSrc: ['\'self\'', 'https://api.openai.com'],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000', // Frontend
      'http://localhost:3001', // Backup
      'http://127.0.0.1:3000', // Frontend
      'http://127.0.0.1:3001', // Backup
    ];

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'x-device-type',
    'x-session-id',
  ],
};

app.use(cors(corsOptions));

// Rate limiting with different limits for AI endpoints
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for AI chat endpoints
const aiChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    error: 'Too many AI chat requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🆕 Rate limiting for analytics endpoints
const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    error: 'Too many analytics requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting
app.use(generalLimiter);

// Webhook routes (must be before body parsing for raw body access)
app.use('/api/webhooks', webhookRoutes);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Clerk middleware (after body parsing)
app.use(clerkMiddleware());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check OpenAI service health
    let aiStatus = 'unknown';
    try {
      const { openAIService } = require('./services/openaiService');
      const aiHealthy = await openAIService.healthCheck();
      aiStatus = aiHealthy ? 'healthy' : 'degraded';
    } catch (error) {
      aiStatus = 'error';
    }

    // 🆕 Check analytics service health
    let analyticsStatus = 'unknown';
    try {
      const { analyticsService } = require('./services/analyticsService');
      const analyticsHealthy = await analyticsService.healthCheck();
      analyticsStatus = analyticsHealthy ? 'healthy' : 'degraded';
    } catch (error) {
      analyticsStatus = 'error';
    }

    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        ai: aiStatus,
        analytics: analyticsStatus,
        server: 'running',
      },
      version: '1.0.0',
      phase: '5 - Advanced Analytics & Adaptive Intelligence',
    };

    // Return 200 if core services are up, 503 if any are down
    const httpStatus = dbStatus === 'connected' ? 200 : 503;
    res.status(httpStatus).json(status);
    
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/learning-paths', learningPathRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/progress', progressRoutes);
// 🆕 Onboarding routes
app.use('/api/onboarding', onboardingRoutes);

// AI Routes with specific rate limiting
app.use('/api/ai/chat', aiChatLimiter);
app.use('/api/ai', aiRoutes);

// 🆕 Phase 4 routes - Assessments & Certificates
app.use('/api/assessments', assessmentRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/certificates', certificateRoutes);

// 🆕 Phase 5 routes - Analytics & Recommendations
app.use('/api/analytics', analyticsLimiter);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/personalization', personalizationRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Sokol Learning Platform API',
    version: '1.0.0',
    phase: '5 - Advanced Analytics & Adaptive Intelligence',
    documentation: '/api/docs',
    health: '/health',
    features: {
      authentication: '✅ Active',
      learningPaths: '✅ Active', 
      progressTracking: '✅ Active',
      aiAssistant: '✅ Active',
      assessments: '✅ Active',
      certificates: '✅ Active',
      analytics: '✅ Active',
      recommendations: '✅ Active',
      adaptiveLearning: '✅ Active',
      portfolio: '✅ Active',
      personalization: '✅ Active',
    },
    endpoints: {
      core: ['/api/auth', '/api/users', '/api/learning-paths', '/api/modules', '/api/progress'],
      ai: ['/api/ai'],
      assessment: ['/api/assessments', '/api/certificates'],
      analytics: ['/api/analytics', '/api/recommendations'],
      portfolio: ['/api/portfolio'],
      personalization: ['/api/personalization'],
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: {
      auth: '/api/auth/*',
      users: '/api/users/*',
      learningPaths: '/api/learning-paths/*',
      modules: '/api/modules/*', 
      progress: '/api/progress/*',
      ai: '/api/ai/*',
      assessments: '/api/assessments/*',
      certificates: '/api/certificates/*',
      analytics: '/api/analytics/*',
      recommendations: '/api/recommendations/*',
      portfolio: '/api/portfolio/*',
    },
  });
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Sokol server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`📍 API endpoints available at http://localhost:${PORT}/api/`);
  console.log(`🤖 AI assistant endpoints at http://localhost:${PORT}/api/ai/`);
  console.log(`📊 Assessment endpoints at http://localhost:${PORT}/api/assessments/`);
  console.log(`🏆 Certificate endpoints at http://localhost:${PORT}/api/certificates/`);
  console.log(`📈 Analytics endpoints at http://localhost:${PORT}/api/analytics/`);
  console.log(`🎯 Recommendation endpoints at http://localhost:${PORT}/api/recommendations/`);
  console.log(`📁 Portfolio endpoints at http://localhost:${PORT}/api/portfolio/`);
  console.log(`💊 Health check at http://localhost:${PORT}/health`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`${signal} signal received: closing HTTP server`);
  server.close(() => {
    console.log('HTTP server closed');
    
    // Stop analytics processor
    const { stopAnalyticsProcessor } = require('./jobs/analyticsProcessor');
    stopAnalyticsProcessor();
    
    // Close database connection
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
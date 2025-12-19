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
// const learningPathRoutes = require('./routes/learningPaths'); // ❌ Removed - deleted by user
// const moduleRoutes = require('./routes/modules'); // ❌ Removed - not used in frontend

const aiRoutes = require('./routes/ai');
// 🆕 Phase 4 routes
const assessmentRoutes = require('./routes/assessments');
// 🆕 Phase 5 routes (simplified - removed unused features)
// const analyticsRoutes = require('./routes/analytics'); // ❌ Removed
// const recommendationRoutes = require('./routes/recommendations'); // ❌ Removed
// 🆕 Webhook routes
const webhookRoutes = require('./routes/webhooks');
// 🆕 Conversation management routes
const conversationRoutes = require('./routes/conversations');
// 🆕 Floating chat routes (lightweight fast chatbot)
const floatingChatRoutes = require('./routes/floatingChat');

const app = express();

// Database connection - ensure it's established before handling requests
let dbConnectionPromise = null;

const ensureDatabaseConnection = async () => {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is in progress, wait for it
  if (dbConnectionPromise) {
    return dbConnectionPromise;
  }

  // Start new connection
  dbConnectionPromise = (async () => {
    try {
      const conn = await connectDatabase();
      
      const runPostConnectInit = async () => {
        try {
          // Drop legacy indexes that cause creation failures
          const { dropLegacyAssessmentQuestionIdIndex, dropLegacyAISessionMessageIdIndex } = require('./config/database-indexes');
          await dropLegacyAssessmentQuestionIdIndex();
          await dropLegacyAISessionMessageIdIndex();
        } catch (e) {
          console.error('❌ Post-connection initialization failed:', e);
        }
      };

      if (conn && mongoose.connection.readyState === 1) {
        await runPostConnectInit();
      } else {
        mongoose.connection.once('connected', runPostConnectInit);
      }
      
      return conn;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      dbConnectionPromise = null; // Reset on error so we can retry
      throw error;
    }
  })();

  return dbConnectionPromise;
};

// Start database connection immediately
ensureDatabaseConnection().catch(err => {
  console.error('❌ Failed to establish database connection:', err);
});

// Middleware to ensure database connection before handling requests
const ensureDbConnectionMiddleware = async (req, res, next) => {
  try {
    // If not connected, wait for connection (with timeout)
    if (mongoose.connection.readyState !== 1) {
      await ensureDatabaseConnection();
    }
    next();
  } catch (error) {
    console.error('❌ Database connection error in middleware:', error);
    // Don't block the request, but log the error
    // Some endpoints might work without DB (like health checks)
    next();
  }
};

// Initialize AI prompts in database (REMOVED - no longer needed)
// const initializeAIPrompts = async () => {
//   try {
//     const AIPrompt = require('./models/AIPrompt');
//     const promptCount = await AIPrompt.countDocuments();
//     
//     if (promptCount === 0) {
//       console.log('🤖 Initializing default AI prompts...');
//       await AIPrompt.createDefaults();
//       console.log('✅ Default AI prompts created');
//     } else {
//       console.log(`📋 Found ${promptCount} AI prompts in database`);
//     }
//   } catch (error) {
//     console.error('⚠️ Failed to initialize AI prompts:', error);
//   }
// };

// 🆕 Initialize analytics system (REMOVED - no longer needed)
// const initializeAnalytics = async () => {
//   try {
//     const AdaptationRule = require('./models/AdaptationRule');
//     const ruleCount = await AdaptationRule.countDocuments();
//     
//     if (ruleCount === 0) {
//       console.log('📊 Initializing default adaptation rules...');
//       await AdaptationRule.createDefaults();
//       console.log('✅ Default adaptation rules created');
//     } else {
//       console.log(`📋 Found ${ruleCount} adaptation rules in database`);
//     }
//     
//     // Start background analytics processor
//     const { startAnalyticsProcessor } = require('./jobs/analyticsProcessor');
//     await startAnalyticsProcessor();
//     console.log('🔄 Analytics processor started');
//     
//   } catch (error) {
//     console.error('⚠️ Failed to initialize analytics:', error);
//   }
// };

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
      'https://corp1o1.vercel.app',
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
    'x-dev-auth',
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


// Apply general rate limiting
app.use(generalLimiter);

// Webhook routes (must be before body parsing for raw body access)
app.use('/api/webhooks', webhookRoutes);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure database connection before handling API requests
app.use('/api', ensureDbConnectionMiddleware);

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
    } catch (_error) {
      aiStatus = 'error';
    }


    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        ai: aiStatus,
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
  


// AI Routes with specific rate limiting
app.use('/api/ai/chat', aiChatLimiter);
app.use('/api/ai', aiRoutes);
// 🆕 Conversation management routes
app.use('/api/conversations', conversationRoutes);
// 🆕 Floating chat routes (lightweight fast chatbot)
app.use('/api/floating-chat', floatingChatRoutes);

// 🆕 Phase 4 routes - Assessments
app.use('/api/assessments', assessmentRoutes);

// 🆕 Conference routes
const conferenceRoutes = require('./routes/conferences');
app.use('/api/conferences', conferenceRoutes);

// 🆕 Certificate routes
const certificateRoutes = require('./routes/certificates');
app.use('/api/certificates', certificateRoutes);

// 🆕 Phase 5 routes - Analytics & Recommendations (REMOVED for optimization)
// app.use('/api/analytics', analyticsLimiter); // ❌ Removed
// app.use('/api/analytics', analyticsRoutes); // ❌ Removed
// app.use('/api/recommendations', recommendationRoutes); // ❌ Removed

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
      aiAssistant: '✅ Active',
      assessments: '✅ Active',
      conversations: '✅ Active',
    },
    endpoints: {
      core: ['/api/auth', '/api/users'],
      ai: ['/api/ai'],
      assessment: ['/api/assessments'],
      conversations: ['/api/conversations'],
      floatingChat: ['/api/floating-chat'],
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
      ai: '/api/ai/*',
      assessments: '/api/assessments/*',
      conversations: '/api/conversations/*',
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
  console.log(`💬 Conversation endpoints at http://localhost:${PORT}/api/conversations/`);
  console.log(`💊 Health check at http://localhost:${PORT}/health`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`${signal} signal received: closing HTTP server`);
  server.close(() => {
    console.log('HTTP server closed');
    
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
process.on('unhandledRejection', (err, _promise) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
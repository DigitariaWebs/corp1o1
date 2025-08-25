# CLAUDE.md - Corp101 Project Overview

**Last Updated**: August 22, 2025

## 🆕 Recent Major Updates (August 2025)

### AI Service Manager Implementation
- **Centralized AI Orchestration**: New `services/aiServiceManager.js` handles all AI operations
- **Cost-Optimized Model Selection**: GPT-4o for complex tasks, GPT-4o-mini for simple operations
- **Three AI Personalities**: ARIA (encouraging), SAGE (analytical), COACH (motivational)
- **Real Content Generation**: Assessments and questions are now AI-generated, not mock data
- **Response Caching**: 5-minute TTL cache for performance optimization

### Assessment System Enhancements
- **Plan Persistence**: Generated assessment plans now save to database
- **Auto Question Generation**: Questions generated on-demand when starting AI assessments
- **Category Mapping**: Automatic mapping of domains to valid assessment categories
- **Test User Support**: Automatic test user creation for development environment
- **Clerk Integration Fix**: Proper handling of Clerk user IDs vs MongoDB ObjectIds

## Project Description
**Corp101** (also known as Sokol Learning Platform) is a revolutionary AI-powered skills assessment and learning platform that replaces traditional diploma-based evaluation with real competency analysis. The platform features adaptive learning paths, advanced AI analytics, blockchain-secured certificates, and comprehensive enterprise solutions.

**Key Value Proposition**: "L'Ère des Compétences" (The Skills Era) - Moving beyond outdated credentials to actual talent recognition through AI-powered assessment and personalized learning.

## Architecture Overview
This is a **full-stack web application** with a clear separation between frontend and backend:

### Backend (Node.js/Express/MongoDB)
- **Framework**: Express.js with comprehensive middleware stack
- **Database**: MongoDB with Mongoose ODM (13 core collections)
- **Authentication**: JWT-based with role-based access control
- **AI Integration**: OpenAI GPT-4o/GPT-4o-mini with intelligent model selection
- **Security**: Helmet, CORS, rate limiting, input sanitization
- **Features**: RESTful API, real-time analytics, automated seeding, Docker support

### Frontend (Next.js/React/TypeScript)
- **Framework**: Next.js 15 with React 19 and TypeScript
- **Styling**: Tailwind CSS with custom revolutionary color palette
- **UI Components**: Radix UI primitives with shadcn/ui component system
- **State Management**: React Context (Auth, Translation)
- **Animations**: Framer Motion for neural network aesthetics
- **Internationalization**: Multi-language support (French/English)

## Key Technologies

### Backend Stack
- **Runtime**: Node.js (>=18.0.0)
- **Framework**: Express.js 4.18.2
- **Database**: MongoDB with Mongoose 8.0.3
- **Authentication**: JWT (jsonwebtoken 9.0.2) + bcryptjs 2.4.3
- **Validation**: Joi 17.11.0 + express-validator 7.0.1
- **Security**: helmet, cors, express-rate-limit, express-mongo-sanitize, xss, hpp
- **AI**: OpenAI 4.20.1
- **Utilities**: lodash, uuid, validator, compression, morgan
- **Development**: nodemon 3.0.2

### Frontend Stack
- **Framework**: Next.js 15.2.4 with React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.17 + PostCSS
- **UI Library**: 45+ Radix UI components + shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **Animation**: Framer Motion 12.23.12 + GSAP 3.13.0
- **Charts**: Recharts for analytics visualization
- **Icons**: Lucide React 0.454.0
- **AI Integration**: OpenAI 5.9.2
- **Notifications**: Sonner

## Recent changes (Aug 2025)
- Added frontend proxy routes for assessments to forward to backend with token or dev header:
  - `/app/api/assessments/generate-questions` → `POST /api/assessments/generate-questions`
  - `/app/api/assessments/evaluate` → `POST /api/assessments/evaluate`
  - `/app/api/assessments/plan` → `POST /api/assessments/plan`
- Custom assessment wizard at `/assessments/new` to create a 3-item plan (diagnostic, focused, stretch).
- Backend accepts both 3-level and 4-level difficulty vocabularies and normalizes to easy/medium/hard.
- Dev auth bypass enabled in backend when header `x-dev-auth: true` is present (non-production only).

## Run and test
### Backend
1. Ensure MongoDB reachable or keep using mock fallbacks for lists
2. `cd backend && npm run dev`
3. Test endpoints with `x-dev-auth: true` header
   - Plan: `POST /api/assessments/plan`
   - Generate: `POST /api/assessments/generate-questions`
   - Evaluate: `POST /api/assessments/evaluate`

### Frontend
1. Set `.env.local` `NEXT_PUBLIC_API_URL=http://localhost:3001`
2. `cd frontend && npm run dev`
3. Use `/assessments/new` → Start a plan → questions generate and UI navigates into session

## Database Schema (MongoDB)
The platform uses **13 core collections** for comprehensive learning management:

### Core Collections
1. **Users** - User management with learning profiles, AI personalities, subscriptions
2. **LearningPaths** - Curriculum structure and organization 
3. **LearningModules** - Individual learning units with adaptive content
4. **UserProgress** - Comprehensive progress tracking and performance metrics
5. **LearningSessions** - Detailed session analytics and engagement tracking
6. **AIPrompts** - AI personality templates (ARIA, SAGE, COACH)
7. **AISessions** - AI conversation history and context
8. **Assessments** - Assessment definitions with AI-powered evaluation
9. **AssessmentSessions** - Individual assessment attempts and results
10. **Certificates** - Blockchain-secured digital certificates
11. **LearningAnalytics** - Advanced analytics and learning insights
12. **AdaptationRules** - AI adaptation logic and triggers
13. **RecommendationEngine** - Personalized learning recommendations

### Key Relationships
- User-centric design with comprehensive tracking
- Learning paths contain multiple modules with prerequisites
- AI sessions provide personalized assistance across all content
- Real-time analytics drive adaptive learning experiences
- Blockchain certificates ensure credential integrity

## AI Service Architecture

### AI Service Manager (`services/aiServiceManager.js`)
Central orchestration system for all AI operations:

#### Model Configuration
- **Assessment Tasks**: GPT-4o (temp: 0.5, tokens: 2000) - Complex assessment generation
- **Evaluation Tasks**: GPT-4o (temp: 0.2, tokens: 1000) - Accurate grading
- **Conversation Tasks**: GPT-4o-mini (temp: 0.7, tokens: 500) - Quick responses
- **Analysis Tasks**: GPT-4o-mini (temp: 0.4, tokens: 800) - Data insights

#### AI Personalities
1. **ARIA** - Encouraging Assistant
   - Model: GPT-4o-mini, Temperature: 0.9
   - Focus: Motivation and confidence building
   - Style: Warm, patient, supportive

2. **SAGE** - Analytical Expert  
   - Model: GPT-4o, Temperature: 0.3
   - Focus: Deep understanding and mastery
   - Style: Professional, thorough, rigorous

3. **COACH** - Motivational Mentor
   - Model: GPT-4o-mini, Temperature: 0.7
   - Focus: Achievement and goals
   - Style: Dynamic, challenging, results-focused

## Core Features

### 1. AI-Powered Learning System
- **Multi-AI Personalities**: ARIA (encouraging), SAGE (analytical), COACH (motivational)
- **Adaptive Content Delivery**: Content adjusted based on learning style and performance
- **Real-time Assistance**: Context-aware AI help throughout learning journey
- **Performance Prediction**: AI predicts completion likelihood and identifies risk factors

### 2. Comprehensive Assessment Engine
- **Multiple Assessment Types**: Skill checks, module completion, path finals, certification
- **AI Evaluation**: Advanced scoring with personalized feedback
- **Adaptive Difficulty**: Real-time difficulty adjustment based on performance
- **Detailed Analytics**: Comprehensive performance insights and recommendations

### 3. Blockchain Certification
- **Tamper-Proof Certificates**: Blockchain-secured credentials
- **Global Verification**: Unique verification codes for instant validation
- **Professional Integration**: Portfolio and LinkedIn integration
- **Multiple Certificate Types**: Completion, mastery, specialization, certification

### 4. Advanced Analytics Dashboard
- **Learning Analytics**: Engagement metrics, progress tracking, performance patterns
- **AI Interaction Analytics**: Assistant usage, satisfaction scores, effectiveness tracking
- **Predictive Insights**: Completion predictions, time estimates, risk assessment
- **Personalized Recommendations**: AI-driven learning path suggestions

### 5. Enterprise Solutions
- **Corporate Dashboards**: Team skills management and analytics
- **Bulk Assessment Tools**: Enterprise-scale evaluation capabilities
- **Integration Hub**: Third-party system connections
- **Custom Learning Paths**: Organization-specific content delivery

### 6. Multi-Role Architecture
- **Individual Learners**: Personal skill development and certification
- **Enterprise Users**: Team and department management capabilities
- **Administrators**: Platform oversight, analytics, and configuration

## API Endpoints Structure

### Core Endpoints
- `/api/auth/*` - Authentication and authorization
- `/api/users/*` - User management and profiles
- `/api/learning-paths/*` - Learning path CRUD operations
- `/api/modules/*` - Learning module management
- `/api/progress/*` - Progress tracking and analytics

### AI Endpoints (Rate Limited)
- `/api/ai/chat` - AI assistant conversations (30 req/15min)
- `/api/ai/*` - AI analysis and recommendations

### Assessment Endpoints
- `/api/assessments/*` - Assessment management and execution
- `/api/certificates/*` - Certificate generation and verification

### Analytics Endpoints (Rate Limited)
- `/api/analytics/*` - Learning analytics and insights (50 req/15min)
- `/api/recommendations/*` - Personalized recommendations

### System Endpoints
- `/health` - Comprehensive health check
- `/` - API documentation and feature status

## Development Commands

### Backend Commands
```bash
npm run dev              # Start development server with nodemon
npm run start           # Start production server
npm run test            # Run Jest tests
npm run seed            # Run comprehensive database seeding
npm run lint            # ESLint code checking
npm run docker:dev      # Start with Docker Compose
npm run setup:dev       # Full development setup
```

### Frontend Commands
```bash
npm run dev             # Start Next.js development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Next.js linting
```

## Environment Configuration

### Backend Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/sokol
MONGODB_TEST_URI=mongodb://localhost:27017/sokol_test

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# AI Services (Updated for AI Service Manager)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL_ASSESSMENT=gpt-4o
OPENAI_MODEL_EVALUATION=gpt-4o
OPENAI_MODEL_CONVERSATION=gpt-4o-mini
OPENAI_MODEL_ANALYSIS=gpt-4o-mini

# AI Personality Settings
OPENAI_TEMP_ARIA=0.9
OPENAI_TEMP_SAGE=0.3
OPENAI_TEMP_COACH=0.7

# Token Limits
OPENAI_MAX_TOKENS_ASSESSMENT=2000
OPENAI_MAX_TOKENS_CONVERSATION=500
OPENAI_CACHE_TTL=300

# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables
```env
# AI Integration
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GEMINI_API_KEY=your_gemini_key

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

## Security Features
- **Comprehensive Security Headers**: Helmet.js with CSP configuration
- **Rate Limiting**: Tiered limits for different endpoint types
- **Input Sanitization**: MongoDB injection and XSS protection
- **Authentication**: JWT-based with secure cookie handling
- **CORS Configuration**: Strict origin validation
- **Data Validation**: Joi and Zod schemas for input validation

## Performance Optimizations
- **Database Indexing**: Strategic indexes on all query-heavy collections
- **Connection Pooling**: Optimized MongoDB connection management
- **Graceful Shutdown**: Proper cleanup on application termination
- **Background Processing**: Analytics processing with scheduled jobs
- **Client-Side Optimizations**: Next.js automatic code splitting and image optimization

## AI Integration Details

### AI Personalities
- **ARIA**: Encouraging, supportive, focuses on motivation and confidence building
- **SAGE**: Analytical, detailed, provides comprehensive explanations and theory
- **COACH**: Motivational, goal-oriented, emphasizes achievement and progress

### AI Features
- **Adaptive Prompting**: Context-aware prompts based on user progress and emotional state
- **Multi-Provider Support**: Fallback system for maximum uptime
- **Performance Analytics**: AI interaction effectiveness tracking
- **Personalization**: Learning style adaptation and preference matching

## User Experience Features

### Revolutionary Design System
- **Dark Theme**: Default neural network aesthetic
- **Color Palette**: Revolutionary blues, cyans, ambers, purples, pinks
- **Animations**: Sophisticated Framer Motion implementations
- **Responsive Design**: Mobile-first approach with custom breakpoints

### Internationalization
- **Supported Languages**: French (primary), English
- **Dynamic Language Switching**: Real-time language changes
- **Localized Content**: Complete translation system with parameter interpolation
- **Cultural Adaptation**: Locale-specific formatting and content

### Accessibility
- **WCAG AA Compliance**: Full accessibility support
- **Keyboard Navigation**: Complete keyboard accessibility
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **High Contrast**: Accessible color combinations

## Development Workflow

### Getting Started
1. Clone repository and install dependencies
2. Set up MongoDB database (local or cloud)
3. Configure environment variables for both frontend and backend
4. Run database seeders for sample data
5. Start both development servers

### Testing Strategy
- **Backend**: Jest testing framework with comprehensive test coverage
- **Frontend**: Built-in Next.js testing capabilities
- **Integration**: API endpoint testing with Postman collections
- **Performance**: Analytics and monitoring for optimization

### Deployment Considerations
- **Docker Support**: Full containerization with docker-compose
- **Environment Separation**: Development, staging, production configurations
- **Database Migration**: Seeding and backup/restore capabilities
- **Health Monitoring**: Comprehensive health check endpoints

## Key Integration Points

### Learning Flow Integration
1. User registers and completes learning profile
2. AI recommends personalized learning paths
3. Adaptive content delivery based on progress and preferences
4. Real-time AI assistance throughout learning modules
5. Comprehensive assessments with AI evaluation
6. Blockchain certificate generation upon completion
7. Continuous analytics and recommendation updates

### Enterprise Integration
- **Bulk User Management**: CSV import/export for team onboarding
- **Custom Branding**: Organization-specific theming and certificates
- **Integration APIs**: Third-party system connections for existing workflows
- **Advanced Reporting**: Comprehensive team analytics and insights

## Key Files Modified (August 2025)

### New Files Created
1. **`services/aiServiceManager.js`** - Central AI service orchestration
2. **`test-ai-service.js`** - AI service testing utility
3. **`test-openai-direct.js`** - Direct OpenAI API testing
4. **`test-assessment-flow.js`** - Complete assessment flow testing

### Modified Files
1. **`controllers/assessmentController.js`**
   - Added assessment plan persistence to database
   - Implemented test user creation for development
   - Fixed category mapping for valid assessment categories
   - Added proper scoring configuration

2. **`services/assessmentService.js`**
   - Added automatic question generation for AI assessments
   - Integrated with AI Service Manager
   - Fixed question formatting and storage

3. **`models/Assessment.js`**
   - Added `isAIGenerated` field to track AI-generated assessments

4. **`controllers/userController.js`**
   - Fixed Clerk user ID handling with MongoDB ObjectIds
   - Added `findUserByRequest` helper function

5. **`.env`**
   - Added comprehensive AI configuration variables
   - Fixed CLERK_WEBHOOK_SECRET format

## Current Project Status
The project is now a comprehensive, production-ready learning management system with:
- ✅ Full-stack architecture implemented
- ✅ Advanced AI integration with intelligent model selection
- ✅ Three distinct AI personalities (ARIA, SAGE, COACH)
- ✅ Real AI content generation (not mock data)
- ✅ Comprehensive database schema with 13 collections
- ✅ Multi-role user management
- ✅ Blockchain certificate system
- ✅ Advanced analytics and recommendations
- ✅ Enterprise-ready features
- ✅ International localization support
- ✅ Comprehensive security implementation
- ✅ Docker deployment support

## Notes for Future Development

### Immediate Priorities
1. **Testing Coverage**: Expand automated testing across all components
2. **Performance Monitoring**: Implement comprehensive monitoring and alerting
3. **Mobile App**: Consider React Native companion app
4. **Advanced Analytics**: Machine learning model improvements

### Long-term Roadmap
1. **AI Model Training**: Custom model development for domain-specific learning
2. **Blockchain Integration**: Enhanced certificate verification and NFT support
3. **Social Learning**: Peer interaction and collaborative learning features
4. **Advanced Gamification**: Achievement systems and learning competitions

### Technical Debt
1. **Frontend Refactoring**: Component optimization and performance improvements
2. **Database Optimization**: Query performance analysis and index optimization
3. **API Versioning**: Implement API versioning for backward compatibility
4. **Documentation**: Comprehensive API documentation with OpenAPI/Swagger

This project represents a sophisticated, enterprise-grade learning management system with cutting-edge AI integration and comprehensive feature set suitable for both individual learners and large organizations.
# Corp101 - AI-Powered Skills Assessment & Learning Platform

> **"L'Ère des Compétences"** - Revolutionizing talent recognition through AI-powered assessment and personalized learning experiences.

## 🚀 Overview

Corp101 (Sokol Learning Platform) is a comprehensive, enterprise-ready learning management system that combines cutting-edge AI technology with adaptive learning principles. The platform moves beyond traditional diploma-based evaluation to provide real competency analysis, personalized learning paths, and blockchain-secured certifications.

## 🏗️ Architecture

### Backend (Node.js/Express/MongoDB)
A robust REST API server with comprehensive middleware stack and advanced AI integration.

### Frontend (Next.js/React/TypeScript)  
A modern, responsive web application with sophisticated UI components and real-time interactions.

---

## 🛠️ Technology Stack

### Backend Technologies

#### Core Framework
- **Node.js** `>=18.0.0` - JavaScript runtime environment
- **Express.js** `4.18.2` - Web application framework
- **MongoDB** with **Mongoose** `8.0.3` - NoSQL database with ODM

#### Authentication & Security
- **JWT** `9.0.2` - JSON Web Token authentication
- **bcryptjs** `2.4.3` - Password hashing
- **Helmet** `7.1.0` - Security headers middleware
- **CORS** `2.8.5` - Cross-Origin Resource Sharing
- **express-rate-limit** `7.1.5` - API rate limiting
- **express-mongo-sanitize** `2.2.0` - MongoDB injection prevention
- **XSS** `1.0.14` - Cross-site scripting protection
- **HPP** `0.2.3` - HTTP Parameter Pollution protection

#### Validation & Data Processing
- **Joi** `17.11.0` - Schema validation
- **express-validator** `7.0.1` - Input validation middleware
- **Validator** `13.11.0` - String validation utilities
- **Lodash** `4.17.21` - Utility functions

#### AI Integration
- **OpenAI** `4.20.1` - GPT-4 integration for adaptive learning
- **Axios** `1.6.2` - HTTP client for API requests

#### Utilities & Performance
- **UUID** `9.0.1` - Unique identifier generation
- **Compression** `1.7.4` - Response compression
- **Morgan** `1.10.0` - HTTP request logging
- **dotenv** `16.3.1` - Environment variable management

#### Development Tools
- **Nodemon** `3.0.2` - Development server auto-restart

### Frontend Technologies

#### Core Framework
- **Next.js** `15.2.4` - React framework with SSR/SSG
- **React** `19` - JavaScript library for user interfaces
- **TypeScript** `5` - Typed JavaScript superset

#### Styling & UI
- **Tailwind CSS** `3.4.17` - Utility-first CSS framework
- **PostCSS** `8.5` - CSS processing toolkit
- **Radix UI** - Accessible component primitives:
  - `@radix-ui/react-accordion`
  - `@radix-ui/react-alert-dialog`
  - `@radix-ui/react-avatar`
  - `@radix-ui/react-checkbox`
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-navigation-menu`
  - `@radix-ui/react-progress`
  - `@radix-ui/react-select`
  - `@radix-ui/react-tabs`
  - `@radix-ui/react-toast`
  - And 25+ more components

#### UI Enhancement
- **shadcn/ui** - Modern component system built on Radix UI
- **Tailwind Merge** `2.5.5` - Utility class merging
- **class-variance-authority** `0.7.1` - Component variant handling
- **tailwindcss-animate** `1.0.7` - CSS animations

#### Animation & Motion
- **Framer Motion** `12.23.12` - Production-ready motion library
- **GSAP** `3.13.0` - High-performance animations
- **canvas-confetti** `1.9.3` - Celebration animations

#### Forms & Validation
- **React Hook Form** - Performant forms with minimal re-renders
- **Zod** `3.24.1` - Schema validation with TypeScript inference
- **@hookform/resolvers** `3.9.1` - Validation resolvers

#### Data Visualization
- **Recharts** - Composable charting library for React
- **@number-flow/react** `0.5.10` - Animated number transitions

#### AI Integration
- **OpenAI** `5.9.2` - GPT-4 integration for frontend features

#### Utilities & Icons
- **Lucide React** `0.454.0` - Beautiful & consistent icon pack
- **clsx** `2.1.1` - Conditional className utility
- **date-fns** `4.1.0` - Modern JavaScript date utility library
- **next-themes** - Theme switching capabilities

#### User Experience
- **Sonner** - Toast notification system
- **cmdk** - Command palette interface
- **input-otp** - OTP input components
- **vaul** - Drawer component
- **embla-carousel-react** - Carousel components
- **react-resizable-panels` - Resizable panel layouts

---

## 📊 Database Schema

### Core Collections (13)

1. **Users** - User management with learning profiles and AI personalities
2. **LearningPaths** - Curriculum structure and organization
3. **LearningModules** - Individual learning units with adaptive content  
4. **UserProgress** - Comprehensive progress tracking and analytics
5. **LearningSessions** - Detailed session tracking and engagement metrics
6. **AIPrompts** - AI personality templates (ARIA, SAGE, COACH)
7. **AISessions** - AI conversation history and context
8. **Assessments** - Assessment definitions with AI-powered evaluation
9. **AssessmentSessions** - Individual assessment attempts and results
10. **Certificates** - Blockchain-secured digital certificates
11. **LearningAnalytics** - Advanced analytics and learning insights
12. **AdaptationRules** - AI adaptation logic and triggers
13. **RecommendationEngine** - Personalized learning recommendations

---

## 🎯 Key Features

### 🤖 AI-Powered Learning
- **Multiple AI Personalities**: ARIA (encouraging), SAGE (analytical), COACH (motivational)
- **Adaptive Content**: Real-time content adjustment based on learning style and performance
- **Intelligent Assistance**: Context-aware AI help throughout the learning journey
- **Predictive Analytics**: AI predicts completion likelihood and identifies risk factors

### 📝 Advanced Assessment Engine
- **Multiple Assessment Types**: Skill checks, module completion, path finals, certification
- **AI Evaluation**: Advanced scoring with personalized feedback
- **Adaptive Difficulty**: Real-time difficulty adjustment
- **Comprehensive Analytics**: Detailed performance insights and recommendations

### 🏆 Blockchain Certification
- **Tamper-Proof Credentials**: Blockchain-secured certificates
- **Global Verification**: Unique verification codes for instant validation
- **Professional Integration**: Portfolio and LinkedIn integration
- **Multiple Certificate Types**: Completion, mastery, specialization, certification

### 📈 Analytics & Insights
- **Learning Analytics**: Engagement metrics, progress tracking, performance patterns
- **AI Interaction Analytics**: Assistant usage, satisfaction scores, effectiveness
- **Predictive Insights**: Completion predictions, time estimates, risk assessment
- **Personalized Recommendations**: AI-driven learning path suggestions

### 🏢 Enterprise Solutions
- **Corporate Dashboards**: Team skills management and analytics
- **Bulk Assessment Tools**: Enterprise-scale evaluation capabilities
- **Integration Hub**: Third-party system connections
- **Custom Learning Paths**: Organization-specific content delivery

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **MongoDB** (local or cloud instance)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd corp101
```

2. **Install dependencies**
```bash
# Install root dependencies (will install both frontend and backend)
npm install
```

3. **Environment Setup**

Create `.env` files in both `backend/` and `frontend/` directories:

**Backend (.env)**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/sokol
MONGODB_TEST_URI=mongodb://localhost:27017/sokol_test

# Authentication
JWT_SECRET=your_super_secure_jwt_secret
JWT_EXPIRES_IN=7d

# AI Services
OPENAI_API_KEY=your_openai_api_key

# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Frontend (.env.local)**
```env
# AI Integration
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GEMINI_API_KEY=your_gemini_api_key

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

4. **Database Setup**
```bash
# Seed the database with sample data
npm run seed
```

5. **Start Development Servers**
```bash
# Start both frontend and backend concurrently
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/health

---

## 📜 Available Scripts

### Root Level Commands
```bash
npm run dev          # Start both frontend and backend in development
npm run build        # Build both frontend and backend for production  
npm run start        # Start both frontend and backend in production
npm run test         # Run tests for both projects
npm run lint         # Lint both frontend and backend code
npm run seed         # Seed the database with sample data
```

### Backend-Specific Commands
```bash
cd backend
npm run dev              # Start backend development server
npm run start           # Start backend production server
npm run test            # Run Jest tests
npm run seed            # Run database seeders
npm run seed:comprehensive # Run comprehensive seeding
npm run lint            # ESLint code checking
npm run docker:dev      # Start with Docker Compose
npm run setup:dev       # Full development setup
```

### Frontend-Specific Commands  
```bash
cd frontend
npm run dev             # Start Next.js development server
npm run build           # Build for production
npm run start           # Start production server  
npm run lint            # Next.js linting
```

---

## 🐳 Docker Deployment

The project includes Docker configuration for easy deployment:

```bash
# Start with Docker Compose (from backend directory)
cd backend
npm run docker:dev

# Or manually with Docker
docker-compose up -d
```

---

## 🔧 API Documentation

### Core Endpoints
- `GET /health` - System health check
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/users/profile` - User profile management
- `GET /api/learning-paths` - Browse learning paths
- `POST /api/progress/update` - Update learning progress

### AI Endpoints (Rate Limited: 30 req/15min)
- `POST /api/ai/chat` - AI assistant conversations
- `POST /api/ai/analysis` - Learning analysis and recommendations

### Assessment Endpoints
- `GET /api/assessments` - Available assessments
- `POST /api/assessments/:id/start` - Start assessment session
- `POST /api/certificates/generate` - Generate completion certificates

### Analytics Endpoints (Rate Limited: 50 req/15min)  
- `GET /api/analytics/progress` - Learning progress analytics
- `GET /api/recommendations` - Personalized recommendations

---

## 🌍 Internationalization

The platform supports multiple languages:
- **French** (primary language)
- **English** (secondary language)

Language switching is available in the user interface with persistent storage.

---

## 🔐 Security Features

- **JWT Authentication** with secure token management
- **Rate Limiting** with tiered limits for different endpoints
- **Input Sanitization** preventing MongoDB injection and XSS
- **CORS Protection** with strict origin validation
- **Security Headers** via Helmet.js
- **Data Validation** using Joi and Zod schemas

---

## 📱 User Roles

### Individual Learners
- Personal skill development and progress tracking
- AI-powered learning assistance
- Certificate earning and verification
- Performance analytics and recommendations

### Enterprise Users  
- Team skills management and oversight
- Bulk assessment administration
- Corporate learning path creation
- Advanced team analytics and reporting

### Administrators
- Platform-wide oversight and configuration
- User management and role assignment  
- System analytics and performance monitoring
- Content management and curation

---

## 🎨 Design System

### Color Palette
- **Revolutionary Blue**: `#1e3a8a`
- **Revolutionary Cyan**: `#22d3ee`
- **Revolutionary Amber**: `#f59e0b`
- **Revolutionary Purple**: `#8b5cf6`
- **Revolutionary Pink**: `#ec4899`

### Theme
- **Default**: Dark theme with neural network aesthetics
- **Animations**: Sophisticated Framer Motion implementations
- **Typography**: Modern, accessible font stack
- **Responsive**: Mobile-first design approach

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the `/health` endpoint for system status
- Review the CLAUDE.md file for technical details

---

## 🔮 Roadmap

### Immediate Priorities
- [ ] Expand automated testing coverage
- [ ] Implement comprehensive monitoring
- [ ] Mobile companion app development
- [ ] Enhanced AI model training

### Long-term Vision
- [ ] Custom AI model development
- [ ] Advanced blockchain integration
- [ ] Social learning features
- [ ] Gamification enhancements

---

**Built with ❤️ using cutting-edge technologies for the future of learning.**
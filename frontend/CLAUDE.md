# CLAUDE.md - Corp1o1 Project Overview

## Project Description
**Corp1o1** is a revolutionary AI-powered skills assessment and learning platform that replaces traditional diploma-based evaluation with real competency analysis. The platform features blockchain-secured certificates, personalized learning paths, and advanced AI analytics for both individual learners and enterprise clients.

**Key Value Proposition**: "L'Ère des Compétences" (The Skills Era) - Moving beyond outdated credentials to actual talent recognition through AI.

## Current Development Status
**Phase 1: COMPLETED** ✅ - Core User Data Integration & Profile Management
**Phase 2: IN PLANNING** 📋 - Learning System Integration with detailed 166-task roadmap
**Backend Server**: Running on port 3001 with MongoDB integration
**Frontend**: Next.js 15 with Clerk authentication and real user data

## Recent changes (Aug 2025)
- Added assessments proxy routes with dev fallback (uses `x-dev-auth: true` if no Authorization):
  - `/app/api/assessments/generate-questions/route.ts`
  - `/app/api/assessments/evaluate/route.ts`
  - `/app/api/assessments/plan/route.ts`
- New wizard at `/assessments/new` to collect intake and create a 3-assessment plan (diagnostic, focused, stretch) via backend plan API.
- Auto-start planned assessments: `/assessments?planned=<json>` triggers Redux session start, question generation, and navigation into `/assessments/{generatedId}`.
- Improved Redux thunks to accept `token` and surface backend error messages.

## How to run
1. Backend: `cd backend && npm run dev`
2. Frontend: `cd frontend && npm run dev`
3. Set `.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:3001`

## Quick test
- Create plan at `/assessments/new` → click Start on a plan
- Questions are generated through the proxy and UI navigates into the assessment
- Essay answers are evaluated via proxy; difficulty terms are normalized backend-side

## Tech Stack
- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom revolutionary color palette
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **AI Integration**: OpenAI GPT-4, Anthropic Claude, Google Gemini
- **State Management**: React Context (Auth, Translation)
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for analytics visualization
- **Notifications**: Sonner for toast notifications

## Project Structure

### Core Application (`/app`)
- **Landing Page** (`page.tsx`): Revolutionary hero section with smart auth redirect
- **Profile Settings** (`profile/page.tsx`): ✅ Complete 5-tab profile management system
- **Dashboard** (`dashboard/page.tsx`): User skills overview with real Clerk data integration
- **Learning System** (`learning/`): Interactive learning paths and modules (Phase 2)
- **Skills Management** (`skills/`): Individual skill tracking and certification (Phase 2)
- **Assessments** (`assessments/page.tsx`): AI-powered skill evaluation (Phase 2 - planned)
- **Certificates** (`certificates/page.tsx`): Blockchain-secured credential management (Phase 3)
- **Portfolio** (`portfolio/page.tsx`): Professional skill portfolio integration (Phase 3)
- **Enterprise** (`enterprise/page.tsx`): Corporate solutions dashboard (Phase 4)
- **Admin** (`admin/page.tsx`): Platform administration interface (Phase 4)

### API Routes (`/app/api`)
- **AI Analysis** (`ai-analysis/route.ts`): Advanced learning analytics with multiple AI providers
- **AI Chat** (`ai-chat/route.ts`): Interactive learning assistant

### Components Architecture (`/components`)

#### UI Foundation (`/ui`)
- Complete shadcn/ui component library (45+ components)
- Custom design system with revolutionary color palette
- Accessible, responsive components

#### Feature Components
- **Authentication**: ✅ Clerk integration with role-based routing and automatic redirects
- **Navigation**: ✅ Landing navigation with smart auth detection and main navigation
- **Dashboard**: ✅ User dashboard with real data, onboarding system, and empty states
- **Profile Management**: ✅ Complete settings page with 5 tabs (Profile, Learning, Notifications, Company, Account)
- **Onboarding**: ✅ Smart one-time welcome system with welcome modal and feature tour
- **Learning**: AI-powered learning assistant and interactive demos (Phase 2)
- **Assessment**: Skills evaluation interface (Phase 2 - next priority)
- **Enterprise**: Corporate dashboard and management tools (Phase 4)
- **Admin**: Administrative controls and analytics (Phase 4)

### Contexts & State Management (`/contexts`)
- **AuthContext**: ✅ Enhanced with real MongoDB user data integration, automatic sync with Clerk, and role-based routing (user/enterprise/admin)
- **TranslationContext**: i18n support (French/English) with localStorage persistence

### Internationalization (`/locales`)
- **Supported Languages**: French (default), English
- **Translation System**: Nested JSON with parameter interpolation
- **Features**: Fallback translations, localStorage persistence, dynamic language switching

### Styling System
- **Custom Tailwind Config**: Revolutionary color palette (blue, cyan, amber, purple, pink)
- **Animations**: Neural network effects, floating elements, gradient shifts
- **Dark Theme**: Default dark theme with custom HSL color variables
- **Responsive Design**: Mobile-first approach with custom breakpoints

## Key Features

### 1. ✅ COMPLETED - User Management & Authentication
- **Clerk Integration**: Seamless authentication with role-based routing
- **Real User Data**: MongoDB sync with automatic profile updates
- **Smart Onboarding**: One-time welcome system with database persistence
- **Profile Management**: 5-tab settings interface with company info for enterprise users
- **Automatic Redirects**: Authenticated users go directly to appropriate dashboard

### 2. ✅ COMPLETED - Intelligent User Experience  
- **Smart Empty States**: Context-aware screens based on user progress
- **Progressive Feature Unlocking**: Celebration system for new capabilities
- **Role-Based Navigation**: Different interfaces for user/enterprise/admin roles
- **Subscription Management**: Support for free/basic/premium/enterprise tiers

### 3. 🔄 NEXT PHASE - AI-Powered Skills Assessment (Phase 2)
- **99.7% Accuracy**: Advanced AI analysis of human skills (planned)
- **Multi-Provider Support**: OpenAI, Anthropic, Gemini with fallback systems (planned)
- **Real-time Analytics**: Comprehensive learning pattern analysis (planned)
- **Personalized Recommendations**: AI-driven learning path optimization (planned)

### 4. 📋 PLANNED - Learning & Certification System (Phase 2-3)
- **Interactive Learning Paths**: Adaptive content delivery (Phase 2)
- **AI Learning Assistant**: Real-time help and guidance (Phase 2) 
- **Progress Tracking**: Detailed analytics and milestone tracking (Phase 2)
- **Blockchain Certification**: Tamper-proof credentials (Phase 3)

### 5. 📋 PLANNED - Enterprise Solutions (Phase 4)
- **Corporate Dashboards**: Team skills management
- **Bulk Assessments**: Enterprise-scale evaluation tools
- **Integration Hub**: Third-party system connections
- **Analytics & Reporting**: Comprehensive team insights

## Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Environment Variables Required
```env
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key  
GEMINI_API_KEY=your_gemini_key
```

## Color Palette
```css
/* Revolutionary Corp1o1 Colors */
--revolutionary-blue: #1e3a8a
--revolutionary-cyan: #22d3ee  
--revolutionary-amber: #f59e0b
--revolutionary-purple: #8b5cf6
--revolutionary-pink: #ec4899
```

## Key User Flows

### 1. New User Registration
Landing → Registration Modal → Role Selection → Dashboard Routing

### 2. Skills Assessment  
Dashboard → Assessments → AI Analysis → Results → Certificates

### 3. Learning Path
Learning → Path Selection → Interactive Modules → Progress Tracking → Completion

### 4. Enterprise Onboarding
Enterprise Registration → Team Setup → Bulk Assessments → Analytics Dashboard

## AI Integration Details

### Analysis Types
- **Learning Path Analysis**: Personalized learning optimization
- **Performance Analysis**: Detailed skill progress evaluation  
- **Recommendations**: AI-driven improvement suggestions

### AI Features
- **Multi-provider Fallback**: Ensures 99.9% uptime
- **Rate Limiting**: 20 requests/minute for analysis endpoints
- **Comprehensive Prompts**: Educational psychology-based analysis
- **Structured Responses**: JSON-formatted AI insights

## Security Features
- **Rate Limiting**: API endpoint protection
- **Role-based Access**: Multi-tier permission system
- **Secure Storage**: localStorage for non-sensitive data only
- **CORS Configuration**: Proper API security headers

## Performance Optimizations
- **Client Components**: Strategic use for interactivity
- **Image Optimization**: Next.js automatic optimization
- **Bundle Splitting**: Automatic code splitting
- **Animation Performance**: GPU-accelerated Framer Motion

## Accessibility
- **Radix UI Foundation**: WAI-ARIA compliant components
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **Color Contrast**: WCAG AA compliant color combinations

## Backend Integration Status

### ✅ COMPLETED API Endpoints
```bash
# User Management
GET/PUT /api/users/profile        # User profile CRUD
GET/PUT /api/users/settings       # Comprehensive settings management  
POST     /api/users/avatar        # Profile image upload
GET/PUT /api/users/onboarding-status /onboarding-step # Onboarding tracking

# Authentication  
POST /api/webhooks/clerk          # Clerk webhook integration
```

### 🔄 READY FOR DEVELOPMENT - Phase 2 APIs
```bash
# Skills Assessment (Next Priority)
GET/POST /api/assessments         # Assessment management
POST     /api/assessments/:id/start /submit # Assessment sessions
GET      /api/skills/progress     # Progress tracking

# Learning System  
GET/POST /api/learning-paths      # Learning path management
GET/POST /api/courses            # Course management
PUT      /api/courses/:id/progress # Progress updates
```

## Current Status  
**Phase 1 COMPLETE**: Full user management system with authentication, profile management, onboarding, and intelligent UX features. Backend running on port 3001 with MongoDB integration. Frontend fully connected with real data.

**Phase 2 READY**: Detailed 166-task roadmap prepared for skills assessment and learning system implementation.

## Development Flow
1. ✅ **Authentication & Users** - Clerk + MongoDB integration complete
2. ✅ **Profile Management** - 5-tab interface with role-based features  
3. ✅ **Smart UX** - Onboarding, empty states, redirects, and user flow
4. 🔄 **Next: Assessment System** - AI-powered skill evaluation (2 weeks)
5. 📋 **Then: Learning Paths** - Interactive courses and content (2 weeks)
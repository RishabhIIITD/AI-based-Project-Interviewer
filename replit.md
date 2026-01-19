# Technical Interview Simulator

## Overview

This is a full-stack web application that serves as a multi-subject learning platform for college students. It supports two practice modes:

1. **Project-Based Interviews**: Users provide project details (title, description, optional link), and the system conducts an adaptive AI-powered interview that assesses technical depth, problem-solving skills, and communication.

2. **Subject Practice Sessions**: Users select from 12 preset CS subjects, optionally upload study materials (notes, PDFs), and practice topic-specific questions tailored to their materials.

After each answer, the system provides ratings, feedback, sample answers, and common mistakes. Sessions conclude with comprehensive performance summaries. The dashboard includes progress tracking with charts, subject-specific analytics, and personalized recommendations for weak areas.

## User Preferences

Preferred communication style: Simple, everyday language.

## Key Features

### Dual Practice Modes
- **Project Interview Tab**: Traditional technical interview based on user's projects
- **Subject Practice Tab**: Topic-based practice across 12 CS subjects

### Study Materials Upload
- Supports .txt, .md, and .pdf file uploads (5MB limit)
- Text content extracted and used for AI question generation
- Materials stored per subject per user

### Progress Tracking Dashboard
- **Score Progress Chart**: Line chart showing performance trends over time (Recharts)
- **Subject Performance Chart**: Bar chart comparing scores across subjects
- **Weak/Strong Subject Recommendations**: Identifies areas needing practice (<60%) and strengths (≥75%)
- **Subject-specific analytics**: Average scores and session counts per subject

### 12 Preset CS Subjects
Data Structures, Algorithms, Database Systems, Operating Systems, Computer Networks, Machine Learning, Web Development, Software Engineering, Computer Architecture, DevOps, Distributed Systems, Cybersecurity

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Animations**: Framer Motion for smooth transitions
- **Charts**: Recharts for progress visualization
- **Build Tool**: Vite with hot module replacement

The frontend follows a page-based structure:
1. Home - Dual-mode practice selector (Project Interview / Subject Practice tabs)
2. Interview - Real-time Q&A interface with feedback display
3. Summary - Final performance report with scores and recommendations
4. Dashboard - Progress charts, subject analytics, and recommendations

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints defined in shared routes file with Zod validation
- **AI Integration**: OpenAI API (via Replit AI Integrations) for generating interview questions and evaluating responses
- **File Upload**: Multer middleware for study material uploads
- **Database ORM**: Drizzle ORM for type-safe database operations

Key design decisions:
- Shared schema and route definitions between client and server ensure type safety
- Storage layer abstracted through interface pattern for testability
- Server handles AI prompt engineering to maintain interview quality and consistency
- Study materials content included in AI prompts for contextual question generation

### Data Storage
- **Database**: PostgreSQL
- **Schema Management**: Drizzle Kit for migrations
- **Key Tables**:
  - `users`: User accounts with email/password authentication and admin flag
  - `interviews`: Stores project details, status, overall score, summary, and subjectId
  - `messages`: Stores conversation history with role, content, and feedback JSON
  - `subjects`: Preset CS subjects with name, description, and icon
  - `userSubjects`: Links users to subjects for tracking
  - `studyMaterials`: Uploaded study files with extracted text content

### Request Flow
1. User submits project/topic details → Creates interview record → AI generates first question (using study materials if available)
2. User answers → Server evaluates with AI → Returns feedback and next question
3. User completes interview → AI generates comprehensive summary with scores
4. Dashboard fetches all interviews and subjects → Calculates analytics by subjectId → Displays charts and recommendations

## External Dependencies

### AI Services
- **OpenAI API**: Used via Replit AI Integrations for interview question generation, answer evaluation, and summary creation. Configured through environment variables `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`.

### Database
- **PostgreSQL**: Required for data persistence. Connection configured via `DATABASE_URL` environment variable. The application uses `connect-pg-simple` for session storage.

### Third-Party Libraries
- **Radix UI**: Headless component primitives for accessible UI components
- **Framer Motion**: Animation library for smooth UI transitions
- **Recharts**: Charting library for progress visualization
- **canvas-confetti**: Celebration effects on high scores
- **date-fns**: Date formatting utilities
- **Zod**: Runtime schema validation for API inputs/outputs
- **Multer**: File upload middleware for study materials

## Recent Changes

### January 2026
- Added multi-subject learning platform with 12 preset CS subjects
- Implemented dual practice modes (Project Interview / Subject Practice)
- Added study materials upload with text extraction
- Built progress tracking dashboard with Recharts (line/bar charts)
- Added weak/strong subject recommendations based on performance thresholds
- Enhanced AI prompts to use uploaded study materials for question generation

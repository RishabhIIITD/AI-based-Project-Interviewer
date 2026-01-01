# Technical Interview Simulator

## Overview

This is a full-stack web application that simulates real technical interviews focused on user projects. Users provide project details (title, description, optional link), and the system conducts an adaptive AI-powered interview that assesses technical depth, problem-solving skills, and communication. After each answer, the system provides ratings, feedback, sample answers, and common mistakes. The interview concludes with a comprehensive performance summary.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Animations**: Framer Motion for smooth transitions
- **Build Tool**: Vite with hot module replacement

The frontend follows a page-based structure with three main views:
1. Home - Project input form
2. Interview - Real-time Q&A interface with feedback display
3. Summary - Final performance report with scores and recommendations

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints defined in shared routes file with Zod validation
- **AI Integration**: OpenAI API (via Replit AI Integrations) for generating interview questions and evaluating responses
- **Database ORM**: Drizzle ORM for type-safe database operations

Key design decisions:
- Shared schema and route definitions between client and server ensure type safety
- Storage layer abstracted through interface pattern for testability
- Server handles AI prompt engineering to maintain interview quality and consistency

### Data Storage
- **Database**: PostgreSQL
- **Schema Management**: Drizzle Kit for migrations
- **Key Tables**:
  - `interviews`: Stores project details, status, overall score, and summary
  - `messages`: Stores conversation history with role, content, and feedback JSON

### Request Flow
1. User submits project details → Creates interview record → AI generates first question
2. User answers → Server evaluates with AI → Returns feedback and next question
3. User completes interview → AI generates comprehensive summary with scores

## External Dependencies

### AI Services
- **OpenAI API**: Used via Replit AI Integrations for interview question generation, answer evaluation, and summary creation. Configured through environment variables `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`.

### Database
- **PostgreSQL**: Required for data persistence. Connection configured via `DATABASE_URL` environment variable. The application uses `connect-pg-simple` for session storage.

### Third-Party Libraries
- **Radix UI**: Headless component primitives for accessible UI components
- **Framer Motion**: Animation library for smooth UI transitions
- **canvas-confetti**: Celebration effects on high scores
- **date-fns**: Date formatting utilities
- **Zod**: Runtime schema validation for API inputs/outputs
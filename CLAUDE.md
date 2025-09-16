# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `npm run dev` - Start development server with Turbo optimization
- `npm run build` - Production build 
- `npm run preview` - Build and start locally (for production testing)
- `npm run typecheck` - TypeScript type checking

### Code Quality
- `npm run check` - Run Biome checks (replaces ESLint/Prettier)
- `npm run check:write` - Fix auto-fixable Biome issues
- `npm run check:unsafe` - Fix issues including potentially unsafe ones

### Database Operations
- `npm run db:setup` - Initial database setup (run after environment setup)
- `npm run db:push` - Push Prisma schema changes to database
- `npm run db:generate` - Generate Prisma client (runs automatically on install)
- `npm run db:migrate` - Run migrations in production
- `npm run db:seed` - Seed database with test data
- `npm run db:studio` - Open Prisma Studio for database inspection

### Testing
- `npm test` - Run all Jest tests
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:coverage` - Generate test coverage report

## Core Architecture

### AI Pipeline System
LeCodeR's core feature is a 6-stage AI pipeline managed by `PipelineManager` (`src/lib/ai/pipeline-manager.ts`):

1. **Concept Extraction** - Extract research concepts from papers
2. **Algorithm Analysis** - Identify algorithms and technical requirements  
3. **Architecture Planning** - Design system structure (placeholder)
4. **Implementation Planning** - Plan implementation details (placeholder)
5. **Code Generation** - Generate executable code (placeholder)
6. **Documentation Generation** - Create documentation (placeholder)

The pipeline uses:
- **Context Management**: `PipelineContext` tracks data across stages
- **Retry Logic**: Exponential backoff for failed operations
- **Real-time Updates**: Database-tracked progress with SSE updates
- **Agent System**: Specialized AI agents for each stage

### Database Schema (Prisma)
Key models in `prisma/schema.prisma`:
- **Project**: Main entity tracking papers and status
- **PipelineStage**: Individual stage execution tracking
- **GeneratedFile**: Output code files from pipeline
- **User/Session/Account**: Better Auth integration
- **UserApiKey**: Encrypted AI service keys
- **AuditLog/SecurityEvent**: Security and compliance tracking

### Authentication & Security
Uses Better Auth (`better-auth` package) with:
- OAuth providers (Google, GitHub)
- Session management with database persistence
- tRPC middleware for authentication, rate limiting, and audit logging
- API key encryption for AI services
- Comprehensive audit trail and security event logging

### API Architecture (tRPC)
Type-safe API with `src/server/api/trpc.ts`:
- **publicProcedure**: Unauthenticated access
- **protectedProcedure**: Authenticated with rate limiting and audit logging
- Built-in middleware for timing, authentication, rate limiting, and audit trails
- Automatic TypeScript types from Prisma schema

### Real-time Updates
Progress tracking via:
- Server-Sent Events (SSE) for pipeline progress
- Database-persisted stage status
- Client-side progress components with live updates

## Development Patterns

### File Organization
- `src/app/` - Next.js 15 App Router pages and API routes
- `src/components/` - Reusable React components (auth, layout, ui)
- `src/lib/` - Utilities (auth, db, pdf processing, AI agents)
- `src/server/api/routers/` - tRPC procedure definitions
- `src/types/` - TypeScript definitions
- `__tests__/` - Test files mirroring src/ structure

### Import Patterns
Use the `~/` alias for all imports from `src/` directory:
```typescript
import { db } from "~/server/db";
import type { PipelineContext } from "~/types/ai";
```

### AI Agent Development
AI agents extend base functionality and include:
- Multiple LLM provider support (OpenAI, Google, Claude)
- Fallback mechanisms between providers
- Structured response validation with Zod
- Comprehensive error handling and retry logic

### Database Operations
All database operations use Prisma ORM with:
- Type safety from generated client
- Transactions for multi-table operations
- Proper indexing for performance
- Migration-based schema evolution

### Error Handling
- React Error Boundaries for UI crashes
- tRPC error formatting with Zod validation
- Pipeline-specific retry mechanisms
- Comprehensive logging via audit system

## Key Dependencies
- **Next.js 15** with App Router and React 19
- **Tailwind CSS v4** for styling
- **tRPC** for type-safe API procedures
- **Prisma** with PostgreSQL for database operations
- **Better Auth** for authentication and session management
- **Vercel AI SDK** for multiple LLM integrations
- **Biome** for code formatting and linting (replaces ESLint/Prettier)
- **Jest + React Testing Library** for testing
- **Turborepo** for build optimization

## Testing Strategy
- Unit tests for utilities, agents, and database operations
- Integration tests for tRPC procedures
- Component tests for React components
- Database testing with separate test database
- Mock AI responses for predictable testing

## Security Considerations
- API keys encrypted in database
- Comprehensive audit logging for all sensitive operations
- Rate limiting implemented at tRPC middleware level
- Input validation with Zod schemas
- Security event tracking and monitoring
- CORS and security headers configured
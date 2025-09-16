# Tech Stack & Build System

## Core Technologies
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: tRPC for type-safe APIs
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with OAuth support (Google, GitHub)
- **AI Integration**: Vercel AI SDK with multiple providers
- **Build System**: Turborepo with npm
- **Code Quality**: Biome (replaces ESLint + Prettier)
- **Testing**: Jest with React Testing Library
- **Documentation**: Fumadocs

## Key Dependencies
- `@ai-sdk/*` - AI provider integrations (OpenAI, Google, Anthropic)
- `better-auth` - Modern authentication solution
- `@trpc/*` - End-to-end typesafe APIs
- `@prisma/client` - Database ORM
- `pdf-parse` - PDF text extraction
- `multer` - File upload handling

## Common Commands

### Development
```bash
npm run dev          # Start development server with Turbo
npm run build        # Production build
npm run start        # Start production server
npm run preview      # Build and start locally
```

### Database
```bash
npm run db:push      # Push schema changes to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations in production
npm run db:seed      # Seed database with test data
npm run db:studio    # Open Prisma Studio
npm run db:setup     # Initial database setup
```

### Code Quality
```bash
npm run check        # Run Biome checks
npm run check:write  # Fix auto-fixable issues
npm run typecheck    # TypeScript type checking
```

### Testing
```bash
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Environment Setup
- Copy `.env.example` to `.env`
- Set up PostgreSQL database
- Configure AI service API keys
- Set Better Auth secret and URLs
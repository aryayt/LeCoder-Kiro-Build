# Database Setup Guide

This guide explains how to set up and manage the PostgreSQL database for LeCodeR MVP.

## Prerequisites

- Docker or PostgreSQL installed locally
- Node.js and npm installed
- Environment variables configured in `.env`

## Quick Setup

### Option 1: Automated Setup (Recommended)

```bash
# Start the database container
./start-database.sh

# Run the complete database setup
npm run db:setup
```

This will:
1. Test database connection
2. Generate Prisma client
3. Run database migrations
4. Seed with sample data

### Option 2: Manual Setup

```bash
# 1. Start PostgreSQL database
./start-database.sh

# 2. Generate Prisma client
npx prisma generate

# 3. Run migrations
npx prisma migrate dev

# 4. Seed database (optional)
npm run db:seed
```

## Database Schema

The LeCodeR database consists of the following main tables:

### Core Tables

#### `users`
- User authentication and profile information
- Supports Better Auth integration
- Links to projects and sessions

#### `projects`
- Research paper projects
- Stores PDF content and metadata
- Tracks processing status and current stage

#### `pipeline_stages`
- 6-stage AI analysis pipeline
- Tracks progress and results for each stage
- Stores input/output data and timing information

#### `generated_files`
- Generated code files and documentation
- Organized by project with file paths and content
- Supports multiple file types (Python, JavaScript, Markdown, etc.)

### Authentication Tables

#### `accounts`
- OAuth provider accounts (Google, GitHub)
- Links external accounts to users

#### `sessions`
- User session management
- Handles authentication state

## Database Operations

### Development Commands

```bash
# View database in browser
npm run db:studio

# Reset database (careful!)
npx prisma migrate reset

# Deploy migrations to production
npm run db:migrate

# Push schema changes without migration
npm run db:push
```

### Seeding

The database includes comprehensive seed data:

- 2 sample users (researcher and student)
- 3 projects in different states (completed, processing, uploaded)
- 18 pipeline stages showing various completion states
- 4 generated files with realistic code examples

```bash
# Run seeding
npm run db:seed
```

## Schema Management

### Making Schema Changes

1. Edit `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name your-change-name`
3. Update TypeScript types: `npx prisma generate`

### Migration Best Practices

- Always create migrations for schema changes
- Test migrations on development data first
- Use descriptive migration names
- Review generated SQL before applying

## Environment Variables

Required environment variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/lecoder-mvp"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
```

## Troubleshooting

### Connection Issues

```bash
# Check if PostgreSQL is running
docker ps

# Check connection
npm run db:setup
```

### Migration Issues

```bash
# Reset database (development only)
npx prisma migrate reset

# Force push schema
npx prisma db push --force-reset
```

### Performance

The schema includes optimized indexes for:
- User project lookups (`projects.userId`)
- Project status filtering (`projects.status`)
- Stage ordering (`pipeline_stages.stageNumber`)
- File organization (`generated_files.projectId`)

## Testing

Database tests are located in `__tests__/db/`:

```bash
# Run database tests
npm test -- __tests__/db/

# Run specific test file
npm test -- __tests__/db/schema.test.ts
```

## Production Deployment

For production deployment:

1. Set up managed PostgreSQL (e.g., Supabase, Railway, Neon)
2. Update `DATABASE_URL` in production environment
3. Run migrations: `npm run db:migrate`
4. Do not run seeding in production

## Monitoring

Key metrics to monitor:
- Connection pool usage
- Query performance
- Database size growth
- Failed migrations

Use `npm run db:studio` for development monitoring and your cloud provider's dashboard for production.
# Local Development Setup Guide

This guide provides step-by-step instructions to set up LeCodeR MVP for local development.

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Docker** (for PostgreSQL database)
- **Git** (for version control)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/aryayt/LeCoder-Kiro-Build.git
cd LeCoder-Kiro-Build
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Prisma Database Configuration
# https://www.prisma.io/docs/reference/database-reference/connection-urls#env
DATABASE_URL="postgresql://postgres:lecoder_dev_2024@localhost:5432/lecoder-mvp"

# Better Auth Configuration
BETTER_AUTH_SECRET="lecoder-dev-secret-key-2024-very-long-and-secure"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# AI Service API Keys (Optional - for AI processing features)
# OPENAI_API_KEY="your-openai-api-key"
# GOOGLE_AI_API_KEY="your-google-ai-api-key"
# ANTHROPIC_API_KEY="your-anthropic-api-key"

# OAuth Providers (Optional - for social login)
# GOOGLE_CLIENT_ID="your-google-client-id"
# GOOGLE_CLIENT_SECRET="your-google-client-secret"
# GITHUB_CLIENT_ID="your-github-client-id"
# GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### 4. Database Setup

Start the PostgreSQL database using Docker:

```bash
# Make the script executable (first time only)
chmod +x start-database.sh

# Start the database
./start-database.sh
```

Set up the database schema and seed data:

```bash
npm run db:setup
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Detailed Setup Instructions

### Database Configuration

The project uses PostgreSQL with the following default configuration:

- **Host**: localhost
- **Port**: 5432
- **Database**: lecoder-mvp
- **Username**: postgres
- **Password**: lecoder_dev_2024

If you need to change these settings, update both:
1. The `DATABASE_URL` in your `.env` file
2. The Docker configuration in `start-database.sh`

### Authentication Setup

The project uses Better Auth for authentication with the following features:

- **Email/Password authentication**
- **OAuth providers** (Google, GitHub) - optional
- **Session management**
- **Password reset functionality**

The `BETTER_AUTH_SECRET` should be a long, random string. For production, generate a secure secret:

```bash
# Generate a secure secret (optional)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### AI Services Configuration (Optional)

LeCodeR supports multiple AI providers for processing research papers:

- **OpenAI GPT models** - Set `OPENAI_API_KEY`
- **Google Gemini** - Set `GOOGLE_AI_API_KEY`
- **Anthropic Claude** - Set `ANTHROPIC_API_KEY`

Without API keys, you can still use the application but AI processing features will be disabled.

### OAuth Setup (Optional)

To enable social login:

1. **Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000/api/auth/callback/google` as redirect URI

2. **GitHub OAuth**:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App
   - Set Authorization callback URL to `http://localhost:3000/api/auth/callback/github`

## Available Scripts

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run preview      # Build and start locally
```

### Database

```bash
npm run db:setup     # Complete database setup (recommended)
npm run db:push      # Push schema changes
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:seed      # Seed with sample data
npm run db:studio    # Open Prisma Studio (database GUI)
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
npm run test:coverage # Run tests with coverage
```

## Project Structure

```
lecoder-mvp/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utility libraries
│   ├── server/              # tRPC server code
│   └── types/               # TypeScript definitions
├── prisma/                  # Database schema and migrations
├── __tests__/               # Test files
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
└── public/                  # Static assets
```

## Testing the Setup

### 1. Database Connection

```bash
# Test database connection
npm run db:studio
```

This should open Prisma Studio in your browser at `http://localhost:5555`

### 2. Authentication

1. Navigate to `http://localhost:3000/auth/register`
2. Create a test account
3. Verify you can log in and access the dashboard

### 3. File Upload

1. Go to `http://localhost:3000/upload`
2. Try uploading a PDF file
3. Verify the upload interface works (AI processing requires API keys)

## Troubleshooting

### Database Issues

```bash
# Check if Docker is running
docker ps

# Restart database
docker stop lecoder-postgres
./start-database.sh

# Reset database (careful - deletes all data)
npm run db:push -- --force-reset
npm run db:seed
```

### Port Conflicts

If port 3000 is in use:

```bash
# Start on different port
npm run dev -- --port 3001
```

Update `BETTER_AUTH_URL` and `NEXT_PUBLIC_BETTER_AUTH_URL` accordingly.

### Environment Variables

Verify your `.env` file:

```bash
# Check if .env exists and has correct format
cat .env
```

### Dependencies

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Production Deployment

For production deployment, see:
- [Database Setup Guide](./database-setup.md)
- [Authentication Implementation](./auth-implementation.md)

## Getting Help

- Check existing documentation in the `docs/` folder
- Review test files in `__tests__/` for usage examples
- Open an issue on the GitHub repository

## Development Workflow

1. **Make changes** to your code
2. **Run tests** to ensure nothing breaks: `npm test`
3. **Check code quality**: `npm run check`
4. **Test locally** in the browser
5. **Commit and push** your changes

The project uses:
- **Biome** for linting and formatting
- **Jest** for testing
- **TypeScript** for type safety
- **Prisma** for database management
- **tRPC** for type-safe APIs
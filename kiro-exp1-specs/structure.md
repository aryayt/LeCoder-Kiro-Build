# Project Structure & Organization

## Root Directory Layout
```
lecoder-mvp/
├── src/                    # Main application source code
├── prisma/                 # Database schema and migrations
├── __tests__/              # Test files organized by feature
├── scripts/                # Utility scripts for setup and maintenance
├── docs/                   # Project documentation
├── public/                 # Static assets
└── [config files]          # Various configuration files
```

## Source Code Organization (`src/`)
```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API route handlers
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard page
│   ├── profile/           # User profile page
│   ├── projects/          # Project-related pages
│   └── upload/            # File upload page
├── components/            # Reusable React components
│   ├── auth/              # Authentication components
│   ├── layout/            # Layout components
│   └── ui/                # UI components
├── lib/                   # Utility libraries and configurations
│   ├── auth/              # Authentication utilities
│   ├── db/                # Database operations
│   ├── pdf/               # PDF processing
│   └── utils/             # General utilities
├── server/                # Server-side code
│   └── api/               # tRPC routers and procedures
├── trpc/                  # tRPC client configuration
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
└── styles/                # Global styles
```

## Key Conventions

### File Naming
- Use kebab-case for files and folders
- React components use PascalCase for the component name
- API routes follow Next.js conventions (`route.ts`)
- Test files end with `.test.ts` or `.test.tsx`

### Import Aliases
- `~/` maps to `src/` directory
- Use absolute imports with the alias for cleaner imports

### Database
- Prisma schema in `prisma/schema.prisma`
- Migrations in `prisma/migrations/`
- Seed data in `prisma/seed.ts`

### Testing Structure
- Tests mirror the `src/` structure in `__tests__/`
- Group tests by feature area (auth, api, components, db, etc.)
- Use descriptive test file names

### Scripts Directory
- Database setup and maintenance scripts
- User management utilities
- Testing and validation scripts

### Documentation
- Feature documentation in `docs/`
- API documentation auto-generated from tRPC
- README files for complex features
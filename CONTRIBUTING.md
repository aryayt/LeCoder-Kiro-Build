# Contributing to LeCodeR MVP

Thank you for your interest in contributing to LeCodeR MVP! This document provides guidelines and information for contributors.

## Quick Links

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- **Be respectful** and inclusive in all interactions
- **Be constructive** when providing feedback or criticism
- **Be collaborative** and help others learn and grow
- **Be patient** with newcomers and those learning
- **Focus on the code**, not the person behind it

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm 9.0 or later
- PostgreSQL 14 or later
- Git for version control

### Development Setup

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/your-username/lecoder-mvp
   cd lecoder-mvp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**:
   ```bash
   npm run db:setup
   npm run db:push
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature development branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Critical production fixes

### Creating a Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### Commit Messages

Use conventional commits:

```bash
feat(pipeline): add retry logic for failed AI operations
fix(auth): resolve session timeout issue
docs(api): update tRPC procedure documentation
test(upload): add file validation tests
refactor(ui): simplify progress tracker component
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Coding Standards

### TypeScript Guidelines

```typescript
// ✅ Good: Explicit types and proper interfaces
interface ProjectData {
  title: string;
  content: string;
  metadata: ProjectMetadata;
}

export async function createProject(data: ProjectData): Promise<Project> {
  return await projectService.create(data);
}

// ❌ Avoid: Using 'any' type
function processData(data: any): any {
  return data;
}
```

### React Component Guidelines

```typescript
// ✅ Good: Proper component structure with JSDoc
interface UploadZoneProps {
  /** Callback function called when a file is uploaded */
  onFileUpload: (file: File) => Promise<void>;
  /** Whether an upload is currently in progress */
  isUploading: boolean;
}

/**
 * A drag-and-drop file upload zone with validation.
 * 
 * @param props - The upload zone configuration
 * @returns JSX element for the upload zone
 */
export function UploadZone({ onFileUpload, isUploading }: UploadZoneProps) {
  // Component implementation
}
```

### File Naming Conventions

- **Files**: kebab-case (`upload-zone.tsx`, `api-client.ts`)
- **Components**: PascalCase (`UploadZone`, `ProgressTracker`)
- **Functions**: camelCase (`createProject`, `validateFile`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`, `API_ENDPOINTS`)

### Code Quality Tools

Run these commands before committing:

```bash
npm run check        # Biome formatting and linting
npm run typecheck    # TypeScript type checking
npm test             # Run test suite
```

## Testing Guidelines

### Test Structure

```typescript
describe('ProjectService', () => {
  let service: ProjectService;
  let mockDb: jest.Mocked<PrismaClient>;
  
  beforeEach(() => {
    mockDb = createMockPrismaClient();
    service = new ProjectService(mockDb);
  });
  
  describe('createProject', () => {
    it('should create project with valid data', async () => {
      // Arrange
      const projectData = createValidProjectData();
      mockDb.project.create.mockResolvedValue(projectData);
      
      // Act
      const result = await service.createProject(projectData);
      
      // Assert
      expect(result).toEqual(projectData);
    });
  });
});
```

### Test Categories

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and database operations
- **E2E Tests**: Test complete user workflows

### Running Tests

```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run end-to-end tests
```

## Documentation

### JSDoc Comments

Add JSDoc comments to all public functions:

```typescript
/**
 * Creates a new project from uploaded PDF content.
 * 
 * @param data - The project creation data
 * @returns Promise that resolves to the created project
 * @throws {ValidationError} When input data is invalid
 * 
 * @example
 * ```typescript
 * const project = await createProject({
 *   title: "Research Paper",
 *   content: "PDF content...",
 *   metadata: { fileName: "paper.pdf" }
 * });
 * ```
 */
export async function createProject(data: CreateProjectInput): Promise<Project> {
  // Implementation
}
```

### Documentation Updates

When adding features, update:

- **API Documentation** - Document new endpoints or procedures
- **README** - Update usage examples and features
- **Architecture Guide** - Document significant architectural changes
- **User Guide** - Add new user-facing features

## Pull Request Process

### Before Submitting

1. **Run quality checks**:
   ```bash
   npm run check
   npm run typecheck
   npm test
   ```

2. **Update documentation** if needed

3. **Add tests** for new functionality

4. **Rebase on latest main**:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

### PR Requirements

- [ ] Clear title and description
- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Linked to related issues

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** on review environment
4. **Approval** from code owners
5. **Merge** to main branch

## Issue Guidelines

### Reporting Bugs

Use the bug report template and include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Error logs or screenshots

### Requesting Features

Use the feature request template and include:

- Problem statement
- Proposed solution
- Use cases and user stories
- Technical considerations

## Getting Help

- **Documentation**: Check the `/docs` folder
- **Issues**: Search existing issues first
- **Discussions**: Use GitHub Discussions for questions
- **Community**: Join our community chat

## Recognition

Contributors are recognized in:

- **CONTRIBUTORS.md** file
- **Release notes** for significant contributions
- **GitHub contributors** page
- **Annual contributor highlights**

## Development Tips

### Useful Commands

```bash
# Database operations
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database (dev only)
npm run db:seed          # Seed with sample data

# Development
npm run dev              # Start dev server with hot reload
npm run build            # Production build
npm run preview          # Test production build locally

# Code quality
npm run check:write      # Auto-fix formatting issues
npm run check:unsafe     # Apply unsafe fixes
```

### Debugging

- Use browser dev tools for frontend debugging
- Use `console.log` sparingly (remove before committing)
- Use TypeScript strict mode for better error catching
- Use Prisma Studio for database inspection

### Performance

- Monitor bundle size with `npm run build`
- Use React DevTools Profiler for performance analysis
- Test with slow network conditions
- Consider accessibility in all UI changes

Thank you for contributing to LeCodeR MVP! 🚀
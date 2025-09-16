# Deployment Guide

This document provides comprehensive instructions for deploying LeCodeR MVP to production using Vercel and Turborepo.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Vercel Deployment](#vercel-deployment)
- [Post-Deployment Verification](#post-deployment-verification)
- [Monitoring and Alerts](#monitoring-and-alerts)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts and Services

1. **Vercel Account** - For hosting the application
2. **Supabase Account** - For PostgreSQL database
3. **AI Service Accounts** (Optional but recommended):
   - OpenAI API key
   - Google AI API key
   - Anthropic API key
4. **Monitoring Services** (Optional):
   - Slack workspace for alerts
   - Email service for notifications

### Local Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd lecoder-mvp

# Install dependencies
npm ci

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# See Environment Setup section below
```

## Environment Setup

### Required Environment Variables

Create a `.env` file with the following variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:password@your-project.supabase.co:5432/postgres"

# Authentication
BETTER_AUTH_SECRET="your-production-secret-key-here"
BETTER_AUTH_URL="https://your-app.vercel.app"
NEXT_PUBLIC_BETTER_AUTH_URL="https://your-app.vercel.app"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# AI Services (Optional)
OPENAI_API_KEY="sk-your-openai-key"
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key"

# Monitoring and Alerts (Optional)
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/your/webhook/url"
ALERT_EMAIL="admin@yourdomain.com"
CRON_SECRET="your-cron-secret-for-maintenance-tasks"
```

### Generating Secrets

```bash
# Generate Better Auth secret
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate cron secret
openssl rand -base64 24
```

## Database Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Wait for the project to be ready
4. Go to Settings > Database
5. Copy the connection string

### 2. Configure Database Connection

```bash
# Update your .env file with the Supabase connection string
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### 3. Run Database Migrations

```bash
# Generate Prisma client
npm run db:generate

# Deploy migrations to production database
npm run db:migrate

# Optional: Seed with initial data (staging only)
npm run db:seed
```

### 4. Verify Database Setup

```bash
# Test database connection
npm run db:studio

# Or run the database health check
tsx scripts/database-monitoring.ts health
```

## Vercel Deployment

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Configure Project

```bash
# Initialize Vercel project
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your team/personal account
# - Link to existing project? No (for new deployment)
# - Project name: lecoder-mvp
# - Directory: ./
# - Override settings? No
```

### 4. Set Environment Variables

```bash
# Set production environment variables
vercel env add DATABASE_URL
vercel env add BETTER_AUTH_SECRET
vercel env add BETTER_AUTH_URL
vercel env add NEXT_PUBLIC_BETTER_AUTH_URL

# Add AI service keys (optional)
vercel env add OPENAI_API_KEY
vercel env add GOOGLE_GENERATIVE_AI_API_KEY
vercel env add ANTHROPIC_API_KEY

# Add OAuth credentials (optional)
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET

# Add monitoring configuration (optional)
vercel env add SLACK_WEBHOOK_URL
vercel env add ALERT_EMAIL
vercel env add CRON_SECRET
```

### 5. Deploy to Production

```bash
# Build and deploy
npm run build:production
vercel --prod

# Or use the deployment script
tsx scripts/deploy-database.ts
```

### 6. Configure Custom Domain (Optional)

```bash
# Add custom domain
vercel domains add yourdomain.com

# Configure DNS records as instructed by Vercel
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# Check application health
curl https://your-app.vercel.app/health

# Check database health
curl https://your-app.vercel.app/api/health/database

# Check metrics
curl https://your-app.vercel.app/api/metrics
```

### 2. Functional Testing

1. **Authentication Flow**:
   - Visit `/auth/register`
   - Create a test account
   - Verify email functionality
   - Test login/logout

2. **Core Functionality**:
   - Upload a test PDF
   - Monitor processing pipeline
   - Verify code generation
   - Test download functionality

3. **Performance Testing**:
   - Check page load times
   - Verify CDN caching
   - Test under load (optional)

### 3. Monitoring Setup

1. **Vercel Analytics** (if enabled):
   - Verify analytics are collecting data
   - Check performance metrics

2. **Custom Monitoring**:
   - Verify error tracking is working
   - Test alert notifications
   - Check log aggregation

## Monitoring and Alerts

### 1. Built-in Monitoring

The application includes several monitoring endpoints:

- `/health` - Overall application health
- `/api/health/database` - Database-specific health
- `/api/metrics` - Application metrics
- `/api/errors` - Error reporting endpoint

### 2. Vercel Monitoring

Vercel provides built-in monitoring:

- **Functions**: Monitor serverless function performance
- **Analytics**: Track page views and performance
- **Speed Insights**: Core Web Vitals monitoring

### 3. Custom Alerts

Configure alerts in your environment:

```bash
# Slack webhook for notifications
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."

# Email for critical alerts
ALERT_EMAIL="admin@yourdomain.com"
```

### 4. Cron Jobs

The application includes automated maintenance:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/maintenance/cleanup",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/health/database",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## Rollback Procedures

### 1. Immediate Rollback (Vercel)

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]

# Or promote a specific deployment
vercel promote [deployment-url] --scope [team-name]
```

### 2. Database Rollback

```bash
# Create database backup before rollback
tsx scripts/database-monitoring.ts backup

# Rollback database migrations (if needed)
npx prisma migrate reset --force

# Restore from backup
# (This depends on your backup strategy)
```

### 3. Rollback Checklist

1. **Identify the Issue**:
   - Check error logs
   - Verify the scope of the problem
   - Determine if rollback is necessary

2. **Communicate**:
   - Notify team members
   - Update status page (if applicable)
   - Prepare user communication

3. **Execute Rollback**:
   - Rollback application deployment
   - Rollback database changes (if needed)
   - Verify functionality

4. **Post-Rollback**:
   - Monitor for issues
   - Investigate root cause
   - Plan fix and re-deployment

### 4. Automated Rollback Triggers

Consider setting up automated rollback triggers:

```bash
# Example: Rollback if error rate exceeds threshold
# This would be implemented in your monitoring system
```

## Troubleshooting

### Common Issues

#### 1. Build Failures

```bash
# Check build logs
vercel logs [deployment-url]

# Common fixes:
npm run typecheck  # Fix TypeScript errors
npm run check      # Fix linting issues
npm ci             # Reinstall dependencies
```

#### 2. Database Connection Issues

```bash
# Test database connection
tsx scripts/database-monitoring.ts health

# Common fixes:
# - Verify DATABASE_URL is correct
# - Check Supabase project status
# - Verify network connectivity
# - Check connection pool limits
```

#### 3. Environment Variable Issues

```bash
# List current environment variables
vercel env ls

# Update environment variable
vercel env rm VARIABLE_NAME
vercel env add VARIABLE_NAME
```

#### 4. Performance Issues

```bash
# Check performance metrics
curl https://your-app.vercel.app/api/metrics

# Common fixes:
# - Optimize database queries
# - Check CDN caching
# - Review bundle size
# - Monitor memory usage
```

### Getting Help

1. **Check Logs**:
   ```bash
   vercel logs
   vercel logs --follow
   ```

2. **Monitor Health**:
   ```bash
   curl https://your-app.vercel.app/health
   ```

3. **Database Diagnostics**:
   ```bash
   tsx scripts/database-monitoring.ts health
   tsx scripts/database-monitoring.ts slow-queries
   ```

4. **Contact Support**:
   - Vercel Support: [vercel.com/support](https://vercel.com/support)
   - Supabase Support: [supabase.com/support](https://supabase.com/support)

## Security Considerations

### 1. Environment Variables

- Never commit `.env` files to version control
- Use Vercel's environment variable management
- Rotate secrets regularly
- Use different secrets for staging and production

### 2. Database Security

- Use connection pooling
- Enable SSL connections
- Regularly update dependencies
- Monitor for suspicious activity

### 3. API Security

- Implement rate limiting
- Validate all inputs
- Use HTTPS everywhere
- Monitor for security incidents

## Performance Optimization

### 1. Caching Strategy

The application uses multiple caching layers:

- **CDN Caching**: Static assets cached at edge
- **API Caching**: API responses cached with appropriate TTL
- **Database Caching**: Query results cached in Redis (if configured)

### 2. Bundle Optimization

```bash
# Analyze bundle size
npm run analyze

# Optimize imports
# Use dynamic imports for heavy components
# Tree-shake unused dependencies
```

### 3. Database Optimization

```bash
# Monitor slow queries
tsx scripts/database-monitoring.ts slow-queries

# Optimize database performance
# Add indexes for frequently queried columns
# Use connection pooling
# Monitor query performance
```

## Maintenance

### 1. Regular Tasks

- **Daily**: Monitor error rates and performance
- **Weekly**: Review and clean up old data
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and optimize performance

### 2. Automated Maintenance

The application includes automated maintenance tasks:

```bash
# Cleanup old data (runs daily at 2 AM UTC)
/api/maintenance/cleanup

# Health checks (runs every 5 minutes)
/api/health/database
```

### 3. Manual Maintenance

```bash
# Clean up old data manually
tsx scripts/database-monitoring.ts cleanup 30

# Generate performance report
tsx scripts/performance-audit.ts

# Update dependencies
npm update
npm audit fix
```

---

For additional support or questions, please refer to the project documentation or contact the development team.
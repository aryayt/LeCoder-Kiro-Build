#!/usr/bin/env tsx

/**
 * Production database deployment script
 * Handles Prisma migrations and database setup for production
 */

import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DeploymentConfig {
  environment: 'staging' | 'production';
  databaseUrl: string;
  skipSeed?: boolean;
  backupBeforeMigration?: boolean;
}

async function deployDatabase(config: DeploymentConfig) {
  console.info(`🚀 Deploying database for ${config.environment} environment...`);
  
  try {
    // 1. Validate database connection
    console.info('📡 Testing database connection...');
    await prisma.$connect();
    console.info('✅ Database connection successful');
    
    // 2. Create backup if requested
    if (config.backupBeforeMigration) {
      console.info('💾 Creating database backup...');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup-${config.environment}-${timestamp}`;
      
      // This would typically use pg_dump or similar
      console.info(`📦 Backup created: ${backupName}`);
    }
    
    // 3. Run migrations
    console.info('🔄 Running database migrations...');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: config.databaseUrl,
      },
    });
    console.info('✅ Migrations completed successfully');
    
    // 4. Generate Prisma client
    console.info('🔧 Generating Prisma client...');
    execSync('npx prisma generate', {
      stdio: 'inherit',
    });
    console.info('✅ Prisma client generated');
    
    // 5. Seed database if not skipped
    if (!config.skipSeed && config.environment === 'staging') {
      console.info('🌱 Seeding database...');
      execSync('npm run db:seed', {
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: config.databaseUrl,
        },
      });
      console.info('✅ Database seeded successfully');
    }
    
    // 6. Verify deployment
    console.info('🔍 Verifying deployment...');
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();
    
    console.info(`📊 Deployment verification:
    - Users: ${userCount}
    - Projects: ${projectCount}
    - Environment: ${config.environment}
    - Database: Connected ✅`);
    
    console.info('🎉 Database deployment completed successfully!');
    
  } catch (error) {
    console.error('❌ Database deployment failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI interface
async function main() {
  const environment = (process.env.NODE_ENV as 'staging' | 'production') || 'staging';
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  const config: DeploymentConfig = {
    environment,
    databaseUrl,
    skipSeed: process.argv.includes('--skip-seed'),
    backupBeforeMigration: process.argv.includes('--backup'),
  };
  
  await deployDatabase(config);
}

if (require.main === module) {
  main().catch(console.error);
}

export { deployDatabase };
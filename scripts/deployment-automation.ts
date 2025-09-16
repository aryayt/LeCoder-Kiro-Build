#!/usr/bin/env tsx

/**
 * Deployment automation script for LeCodeR MVP
 * Handles pre-deployment checks, deployment, and post-deployment verification
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { deployDatabase } from './deploy-database';
import { checkDatabaseHealth } from './database-monitoring';

interface DeploymentConfig {
  environment: 'staging' | 'production';
  skipTests?: boolean;
  skipDatabaseMigration?: boolean;
  skipHealthChecks?: boolean;
  rollbackOnFailure?: boolean;
}

interface DeploymentResult {
  success: boolean;
  deploymentUrl?: string;
  error?: string;
  rollbackUrl?: string;
  duration: number;
}

class DeploymentAutomation {
  private config: DeploymentConfig;
  private startTime: number;
  
  constructor(config: DeploymentConfig) {
    this.config = config;
    this.startTime = Date.now();
  }
  
  async deploy(): Promise<DeploymentResult> {
    console.info(`🚀 Starting deployment to ${this.config.environment}...`);
    
    try {
      // Pre-deployment checks
      await this.preDeploymentChecks();
      
      // Database migration
      if (!this.config.skipDatabaseMigration) {
        await this.runDatabaseMigration();
      }
      
      // Build and deploy
      const deploymentUrl = await this.buildAndDeploy();
      
      // Post-deployment verification
      if (!this.config.skipHealthChecks) {
        await this.postDeploymentVerification(deploymentUrl);
      }
      
      const duration = Date.now() - this.startTime;
      
      console.info(`✅ Deployment completed successfully in ${duration}ms`);
      console.info(`🌐 Deployment URL: ${deploymentUrl}`);
      
      return {
        success: true,
        deploymentUrl,
        duration,
      };
      
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      
      const duration = Date.now() - this.startTime;
      
      if (this.config.rollbackOnFailure) {
        console.info('🔄 Attempting automatic rollback...');
        const rollbackUrl = await this.rollback();
        
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          rollbackUrl,
          duration,
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      };
    }
  }
  
  private async preDeploymentChecks() {
    console.info('🔍 Running pre-deployment checks...');
    
    // Check if required files exist
    const requiredFiles = [
      'package.json',
      'next.config.js',
      'vercel.json',
      'prisma/schema.prisma',
    ];
    
    for (const file of requiredFiles) {
      if (!existsSync(file)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
    
    // Check environment variables
    this.checkEnvironmentVariables();
    
    // Run type checking
    console.info('📝 Running TypeScript checks...');
    execSync('npm run typecheck', { stdio: 'inherit' });
    
    // Run linting
    console.info('🔧 Running code quality checks...');
    execSync('npm run check', { stdio: 'inherit' });
    
    // Run tests (if not skipped)
    if (!this.config.skipTests) {
      console.info('🧪 Running tests...');
      execSync('npm test -- --passWithNoTests', { stdio: 'inherit' });
    }
    
    console.info('✅ Pre-deployment checks passed');
  }
  
  private checkEnvironmentVariables() {
    const requiredEnvVars = [
      'DATABASE_URL',
      'BETTER_AUTH_SECRET',
      'BETTER_AUTH_URL',
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    // Validate URL format
    try {
      new URL(process.env.BETTER_AUTH_URL!);
    } catch {
      throw new Error('BETTER_AUTH_URL is not a valid URL');
    }
  }
  
  private async runDatabaseMigration() {
    console.info('🗄️ Running database migration...');
    
    await deployDatabase({
      environment: this.config.environment,
      databaseUrl: process.env.DATABASE_URL!,
      skipSeed: this.config.environment === 'production',
      backupBeforeMigration: this.config.environment === 'production',
    });
    
    console.info('✅ Database migration completed');
  }
  
  private async buildAndDeploy(): Promise<string> {
    console.info('🏗️ Building application...');
    
    // Build with Turborepo
    execSync('npm run build:production', { stdio: 'inherit' });
    
    console.info('📦 Deploying to Vercel...');
    
    // Deploy to Vercel
    const deployCommand = this.config.environment === 'production' 
      ? 'vercel --prod --yes'
      : 'vercel --yes';
    
    const deploymentOutput = execSync(deployCommand, { encoding: 'utf8' });
    
    // Extract deployment URL from output
    const urlMatch = deploymentOutput.match(/https:\/\/[^\s]+/);
    if (!urlMatch) {
      throw new Error('Could not extract deployment URL from Vercel output');
    }
    
    return urlMatch[0];
  }
  
  private async postDeploymentVerification(deploymentUrl: string) {
    console.info('🔍 Running post-deployment verification...');
    
    // Wait for deployment to be ready
    await this.waitForDeployment(deploymentUrl);
    
    // Health check
    await this.verifyHealthEndpoint(deploymentUrl);
    
    // Database connectivity
    await this.verifyDatabaseConnectivity();
    
    // Basic functionality test
    await this.verifyBasicFunctionality(deploymentUrl);
    
    console.info('✅ Post-deployment verification passed');
  }
  
  private async waitForDeployment(url: string, maxAttempts = 30) {
    console.info('⏳ Waiting for deployment to be ready...');
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          console.info('✅ Deployment is ready');
          return;
        }
      } catch {
        // Ignore errors and retry
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Deployment did not become ready within expected time');
  }
  
  private async verifyHealthEndpoint(deploymentUrl: string) {
    console.info('🏥 Checking health endpoint...');
    
    const healthUrl = `${deploymentUrl}/health`;
    const response = await fetch(healthUrl);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
    }
    
    const health = await response.json();
    
    if (health.status !== 'healthy') {
      throw new Error(`Application is not healthy: ${health.status}`);
    }
    
    console.info('✅ Health check passed');
  }
  
  private async verifyDatabaseConnectivity() {
    console.info('🗄️ Verifying database connectivity...');
    
    const dbHealth = await checkDatabaseHealth();
    
    if (dbHealth.connectionStatus !== 'healthy') {
      throw new Error('Database connectivity check failed');
    }
    
    console.info('✅ Database connectivity verified');
  }
  
  private async verifyBasicFunctionality(deploymentUrl: string) {
    console.info('🧪 Testing basic functionality...');
    
    // Test static pages
    const pages = ['/', '/auth/login', '/auth/register'];
    
    for (const page of pages) {
      const response = await fetch(`${deploymentUrl}${page}`);
      if (!response.ok) {
        throw new Error(`Page ${page} returned ${response.status}`);
      }
    }
    
    // Test API endpoints
    const apiEndpoints = ['/api/health', '/api/metrics'];
    
    for (const endpoint of apiEndpoints) {
      const response = await fetch(`${deploymentUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`API endpoint ${endpoint} returned ${response.status}`);
      }
    }
    
    console.info('✅ Basic functionality verified');
  }
  
  private async rollback(): Promise<string | undefined> {
    try {
      console.info('🔄 Getting previous deployment...');
      
      const deploymentsOutput = execSync('vercel ls --limit 5', { encoding: 'utf8' });
      const lines = deploymentsOutput.split('\n');
      
      // Find the second deployment (first is current, second is previous)
      let previousDeployment: string | undefined;
      
      for (let i = 1; i < lines.length; i++) {
        const rawLine = lines[i];
        if (!rawLine) {
          continue;
        }
        const line = rawLine.trim();
        if (line && line.includes('https://')) {
          const urlMatch = line.match(/https:\/\/[^\s]+/);
          if (urlMatch) {
            previousDeployment = urlMatch[0];
            break;
          }
        }
      }
      
      if (!previousDeployment) {
        throw new Error('No previous deployment found for rollback');
      }
      
      console.info(`🔄 Rolling back to: ${previousDeployment}`);
      
      execSync(`vercel rollback ${previousDeployment}`, { stdio: 'inherit' });
      
      console.info('✅ Rollback completed');
      
      return previousDeployment;
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      return undefined;
    }
  }
}

// CLI interface
async function main() {
  const environment = (process.argv[2] as 'staging' | 'production') || 'staging';
  const flags = process.argv.slice(3);
  
  const config: DeploymentConfig = {
    environment,
    skipTests: flags.includes('--skip-tests'),
    skipDatabaseMigration: flags.includes('--skip-db'),
    skipHealthChecks: flags.includes('--skip-health'),
    rollbackOnFailure: flags.includes('--rollback-on-failure'),
  };
  
  console.info('🚀 Deployment Configuration:');
  console.info(JSON.stringify(config, null, 2));
  
  const deployment = new DeploymentAutomation(config);
  const result = await deployment.deploy();
  
  if (result.success) {
    console.info('🎉 Deployment successful!');
    process.exit(0);
  } else {
    console.error('💥 Deployment failed!');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { DeploymentAutomation };
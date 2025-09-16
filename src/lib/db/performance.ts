import { db } from '~/server/db';
import { cache, CacheKeys, CacheTTL } from '~/lib/cache/redis';
import type { GeneratedFile, Prisma } from '@prisma/client';
import { ProjectStatus, StageStatus } from '@prisma/client';

interface ProjectSummary {
  id: string;
  title: string;
  status: ProjectStatus;
  currentStage: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: Prisma.JsonValue | null;
  _count: {
    generatedFiles: number;
    stages: number;
  };
}

interface ProjectStageSummary {
  id: string;
  stageNumber: number;
  stageName: string;
  status: StageStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
}

interface ProjectFileSummary {
  id: string;
  filePath: string;
  fileType: string;
  createdAt: Date;
}

interface ProjectWithStages {
  id: string;
  title: string;
  status: ProjectStatus;
  currentStage: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: Prisma.JsonValue | null;
  stages: ProjectStageSummary[];
  generatedFiles: ProjectFileSummary[];
}


/**
 * Optimized database queries with caching
 */
export class DatabasePerformanceManager {
  /**
   * Get user projects with optimized query and caching
   */
  async getUserProjects(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: ProjectStatus;
      orderBy?: 'createdAt' | 'updatedAt' | 'title';
      orderDir?: 'asc' | 'desc';
    } = {}
  ): Promise<{ projects: ProjectSummary[]; total: number }> {
    const {
      limit = 10,
      offset = 0,
      status,
      orderBy = 'createdAt',
      orderDir = 'desc',
    } = options;

    const cacheKey = CacheKeys.userProjects(
      `${userId}:${limit}:${offset}:${status}:${orderBy}:${orderDir}`
    );

    return cache.getOrSet(
      cacheKey,
      async () => {
        const where: Prisma.ProjectWhereInput = {
          userId,
          ...(status ? { status } : {}),
        };

        const [projects, total] = await Promise.all([
          db.project.findMany({
            where,
            orderBy: { [orderBy]: orderDir },
            take: limit,
            skip: offset,
            select: {
              id: true,
              title: true,
              status: true,
              currentStage: true,
              createdAt: true,
              updatedAt: true,
              metadata: true,
              _count: {
                select: {
                  generatedFiles: true,
                  stages: true,
                },
              },
            },
          }),
          db.project.count({ where }),
        ]);

        return { projects, total };
      },
      CacheTTL.SHORT
    );
  }

  /**
   * Get project with stages - optimized with selective loading
   */
  async getProjectWithStages(projectId: string): Promise<ProjectWithStages | null> {
    const cacheKey = CacheKeys.project(projectId);

    return cache.getOrSet(
      cacheKey,
      async () => {
        return db.project.findUnique({
          where: { id: projectId },
          select: {
            id: true,
            title: true,
            status: true,
            currentStage: true,
            createdAt: true,
            updatedAt: true,
            metadata: true,
            stages: {
              orderBy: { stageNumber: 'asc' },
              select: {
                id: true,
                stageNumber: true,
                stageName: true,
                status: true,
                startedAt: true,
                completedAt: true,
                errorMessage: true,
              },
            },
            generatedFiles: {
              select: {
                id: true,
                filePath: true,
                fileType: true,
                createdAt: true,
              },
            },
          },
        });
      },
      CacheTTL.MEDIUM
    );
  }

  /**
   * Get project files with caching
   */
  async getProjectFiles(projectId: string): Promise<GeneratedFile[]> {
    const cacheKey = CacheKeys.projectFiles(projectId);

    return cache.getOrSet(
      cacheKey,
      async () => {
        return db.generatedFile.findMany({
          where: { projectId },
          orderBy: { filePath: 'asc' },
        });
      },
      CacheTTL.LONG
    );
  }

  /**
   * Batch update pipeline stages for better performance
   */
  async batchUpdatePipelineStages(
    updates: Array<{
      projectId: string;
      stageNumber: number;
      status: StageStatus;
      outputData?: any;
      errorMessage?: string;
      completedAt?: Date;
    }>
  ): Promise<void> {
    await db.$transaction(
      updates.map(update =>
        db.pipelineStage.update({
          where: {
            projectId_stageNumber: {
              projectId: update.projectId,
              stageNumber: update.stageNumber,
            },
          },
          data: {
            status: update.status,
            outputData: update.outputData,
            errorMessage: update.errorMessage,
            completedAt: update.completedAt,
          },
        })
      )
    );

    // Invalidate cache for affected projects
    for (const update of updates) {
      await cache.del(CacheKeys.project(update.projectId));
    }
  }

  /**
   * Bulk insert generated files for better performance
   */
  async bulkInsertGeneratedFiles(
    projectId: string,
    files: Array<{
      filePath: string;
      fileContent: string;
      fileType: string;
    }>
  ): Promise<void> {
    await db.generatedFile.createMany({
      data: files.map(file => ({
        projectId,
        ...file,
      })),
    });

    // Invalidate cache
    await cache.del(CacheKeys.projectFiles(projectId));
    await cache.del(CacheKeys.project(projectId));
  }

  /**
   * Get system statistics with caching
   */
  async getSystemStats(): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalUsers: number;
    recentActivity: number;
  }> {
    const cacheKey = CacheKeys.systemStats();

    return cache.getOrSet(
      cacheKey,
      async () => {
        const [
          totalProjects,
          activeProjects,
          completedProjects,
          totalUsers,
          recentActivity,
        ] = await Promise.all([
          db.project.count(),
          db.project.count({ where: { status: ProjectStatus.PROCESSING } }),
          db.project.count({ where: { status: ProjectStatus.COMPLETED } }),
          db.user.count(),
          db.project.count({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
            },
          }),
        ]);

        return {
          totalProjects,
          activeProjects,
          completedProjects,
          totalUsers,
          recentActivity,
        };
      },
      CacheTTL.MEDIUM
    );
  }

  /**
   * Clean up old projects and files
   */
  async cleanupOldData(daysOld: number = 30): Promise<{
    deletedProjects: number;
    deletedFiles: number;
  }> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const oldProjects = await db.project.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: { in: [ProjectStatus.COMPLETED, ProjectStatus.ERROR, ProjectStatus.CANCELLED] },
      },
      select: { id: true },
    });

    const deletedFiles = await db.generatedFile.deleteMany({
      where: {
        projectId: { in: oldProjects.map(p => p.id) },
      },
    });

    const deletedProjects = await db.project.deleteMany({
      where: {
        id: { in: oldProjects.map(p => p.id) },
      },
    });

    // Invalidate related cache
    for (const project of oldProjects) {
      await cache.del(CacheKeys.project(project.id));
      await cache.del(CacheKeys.projectFiles(project.id));
    }

    return {
      deletedProjects: deletedProjects.count,
      deletedFiles: deletedFiles.count,
    };
  }

  /**
   * Analyze query performance
   */
  async analyzeQueryPerformance(): Promise<{
    slowQueries: Array<{
      query: string;
      avgDuration: number;
      callCount: number;
    }>;
    recommendations: string[];
  }> {
    // This would typically connect to PostgreSQL's pg_stat_statements
    // For now, return mock data with recommendations
    return {
      slowQueries: [],
      recommendations: [
        'Consider adding indexes on frequently queried columns',
        'Use connection pooling for better performance',
        'Implement query result caching for expensive operations',
        'Consider database partitioning for large tables',
      ],
    };
  }
}

export const dbPerformance = new DatabasePerformanceManager();
import { withLazyLoading } from '~/lib/utils/lazy-loading';
import type { FilePreviewProps } from '~/components/ui/file-preview';
import type { ProgressTrackerProps } from '~/components/ui/progress-tracker';
import type { ProjectListProps } from '~/components/ui/project-list';
import type { DashboardStatsProps } from '~/components/ui/dashboard-stats';
import type { UploadZoneProps } from '~/components/ui/upload-zone';
import type { AlgorithmAnalyzerAgent } from '~/lib/ai/agents/algorithm-analyzer';
import type { CodeGeneratorAgent } from '~/lib/ai/agents/code-generator';
import type { ConceptExtractorAgent } from '~/lib/ai/agents/concept-extractor';

// Lazy load heavy components
export const LazyFilePreview = withLazyLoading<FilePreviewProps>(
  () => import('~/components/ui/file-preview').then((mod) => ({ default: mod.FilePreview }))
);

export const LazyProgressTracker = withLazyLoading<ProgressTrackerProps>(
  () => import('~/components/ui/progress-tracker').then((mod) => ({ default: mod.ProgressTracker }))
);

export const LazyProjectList = withLazyLoading<ProjectListProps>(
  () => import('~/components/ui/project-list').then((mod) => ({ default: mod.ProjectList }))
);

export const LazyDashboardStats = withLazyLoading<DashboardStatsProps>(
  () => import('~/components/ui/dashboard-stats').then((mod) => ({ default: mod.DashboardStats }))
);

export const LazyUploadZone = withLazyLoading<UploadZoneProps>(
  () => import('~/components/ui/upload-zone').then((mod) => ({ default: mod.UploadZone }))
);

// AI-related helpers (non-React classes)
export const LazyAIComponents = {
  ConceptExtractor: async (): Promise<typeof ConceptExtractorAgent> =>
    (await import('~/lib/ai/agents/concept-extractor')).ConceptExtractorAgent,
  AlgorithmAnalyzer: async (): Promise<typeof AlgorithmAnalyzerAgent> =>
    (await import('~/lib/ai/agents/algorithm-analyzer')).AlgorithmAnalyzerAgent,
  CodeGenerator: async (): Promise<typeof CodeGeneratorAgent> =>
    (await import('~/lib/ai/agents/code-generator')).CodeGeneratorAgent,
};

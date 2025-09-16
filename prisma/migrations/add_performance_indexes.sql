-- Add performance indexes for better query optimization

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS "projects_user_status_created_idx" ON "projects" ("userId", "status", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "projects_status_updated_idx" ON "projects" ("status", "updatedAt" DESC);

-- Pipeline stages optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS "pipeline_stages_project_status_idx" ON "pipeline_stages" ("projectId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "pipeline_stages_status_created_idx" ON "pipeline_stages" ("status", "createdAt" DESC);

-- Generated files optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS "generated_files_project_type_idx" ON "generated_files" ("projectId", "fileType");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "generated_files_type_created_idx" ON "generated_files" ("fileType", "createdAt" DESC);

-- User sessions optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS "session_user_expires_idx" ON "session" ("userId", "expiresAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "session_expires_idx" ON "session" ("expiresAt") WHERE "expiresAt" > NOW();

-- API keys optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS "user_api_keys_user_active_idx" ON "user_api_keys" ("userId", "isActive");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "user_api_keys_provider_active_idx" ON "user_api_keys" ("provider", "isActive");

-- Audit logs optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_logs_user_action_created_idx" ON "audit_logs" ("userId", "action", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_logs_resource_created_idx" ON "audit_logs" ("resource", "resourceId", "createdAt" DESC);

-- Security events optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS "security_events_type_severity_created_idx" ON "security_events" ("eventType", "severity", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "security_events_user_resolved_idx" ON "security_events" ("userId", "resolved", "createdAt" DESC);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY IF NOT EXISTS "projects_active_idx" ON "projects" ("userId", "createdAt" DESC) WHERE "status" IN ('UPLOADED', 'PROCESSING');
CREATE INDEX CONCURRENTLY IF NOT EXISTS "pipeline_stages_active_idx" ON "pipeline_stages" ("projectId", "stageNumber") WHERE "status" IN ('PENDING', 'PROCESSING', 'RETRYING');

-- Text search indexes (if using PostgreSQL full-text search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "projects_title_search_idx" ON "projects" USING gin(to_tsvector('english', "title"));
CREATE INDEX CONCURRENTLY IF NOT EXISTS "generated_files_path_search_idx" ON "generated_files" USING gin(to_tsvector('english', "filePath"));

-- Statistics for query planner
ANALYZE "projects";
ANALYZE "pipeline_stages";
ANALYZE "generated_files";
ANALYZE "user_api_keys";
ANALYZE "audit_logs";
ANALYZE "security_events";
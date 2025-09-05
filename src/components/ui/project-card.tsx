"use client";

import { clsx } from "clsx";
import type { PipelineStage } from "./progress-tracker";

interface Project {
  id: string;
  title: string;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'ERROR' | 'CANCELLED';
  metadata: {
    fileName: string;
    fileSize: number;
    pageCount: number;
    authors?: string[];
  };
  createdAt: string;
  updatedAt: string;
  pipelineStages?: PipelineStage[];
}

interface ProjectCardProps {
  project: Project;
  onView?: (projectId: string) => void;
  onDownload?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
  className?: string;
}

export function ProjectCard({ 
  project, 
  onView, 
  onDownload, 
  onDelete, 
  className 
}: ProjectCardProps) {
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      case 'UPLOADED':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: Project['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completed';
      case 'PROCESSING':
        return 'Processing';
      case 'ERROR':
        return 'Error';
      case 'CANCELLED':
        return 'Cancelled';
      case 'UPLOADED':
      default:
        return 'Uploaded';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const completedStages = project.pipelineStages?.filter(stage => stage.status === 'COMPLETED').length || 0;
  const totalStages = project.pipelineStages?.length || 6;
  const progressPercentage = (completedStages / totalStages) * 100;

  return (
    <div className={clsx(
      "bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {project.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {project.metadata.fileName}
          </p>
        </div>
        
        <span className={clsx(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
          getStatusColor(project.status)
        )}>
          {getStatusText(project.status)}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{completedStages}/{totalStages} stages</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
        <div>
          <span className="font-medium">Size:</span> {formatFileSize(project.metadata.fileSize)}
        </div>
        <div>
          <span className="font-medium">Pages:</span> {project.metadata.pageCount}
        </div>
        <div className="col-span-2">
          <span className="font-medium">Created:</span> {new Date(project.createdAt).toLocaleDateString()}
        </div>
        {project.metadata.authors && project.metadata.authors.length > 0 && (
          <div className="col-span-2">
            <span className="font-medium">Authors:</span> {project.metadata.authors.join(', ')}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={() => onView?.(project.id)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Details
        </button>
        
        <div className="flex items-center space-x-3">
          {project.status === 'COMPLETED' && (
            <button
              onClick={() => onDownload?.(project.id)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </button>
          )}
          
          <button
            onClick={() => onDelete?.(project.id)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
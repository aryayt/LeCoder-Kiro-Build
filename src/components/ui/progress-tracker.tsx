"use client";

import { clsx } from "clsx";

export interface PipelineStage {
  id: string;
  stageNumber: number;
  stageName: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ERROR' | 'RETRYING';
  errorMessage?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

interface ProgressTrackerProps {
  stages: PipelineStage[];
  currentStage: number;
  className?: string;
}

export function ProgressTracker({ stages, currentStage, className }: ProgressTrackerProps) {
  const getStageIcon = (stage: PipelineStage, index: number) => {
    const isActive = index + 1 === currentStage;
    const isCompleted = stage.status === 'COMPLETED';
    const isError = stage.status === 'ERROR';
    const isProcessing = stage.status === 'PROCESSING' || stage.status === 'RETRYING';

    if (isError) {
      return (
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }

    if (isCompleted) {
      return (
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }

    if (isProcessing) {
      return (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <div className={clsx(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
        {
          "bg-blue-100 text-blue-600": isActive,
          "bg-gray-100 text-gray-400": !isActive && !isCompleted,
        }
      )}>
        {index + 1}
      </div>
    );
  };

  const getStageStatus = (stage: PipelineStage) => {
    switch (stage.status) {
      case 'COMPLETED':
        return 'Completed';
      case 'PROCESSING':
        return 'Processing...';
      case 'RETRYING':
        return 'Retrying...';
      case 'ERROR':
        return 'Error';
      case 'PENDING':
      default:
        return 'Pending';
    }
  };

  return (
    <div className={clsx("space-y-4", className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Processing Pipeline
        </h3>
        <p className="text-sm text-gray-600">
          Your research paper is being analyzed and converted to code
        </p>
      </div>

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const isActive = index + 1 === currentStage;
          const isCompleted = stage.status === 'COMPLETED';
          const isError = stage.status === 'ERROR';

          return (
            <div key={stage.id} className="flex items-start space-x-4">
              {getStageIcon(stage, index)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={clsx(
                    "text-sm font-medium",
                    {
                      "text-gray-900": isActive || isCompleted,
                      "text-gray-500": !isActive && !isCompleted && !isError,
                      "text-red-600": isError,
                    }
                  )}>
                    {stage.stageName}
                  </h4>
                  <span className={clsx(
                    "text-xs",
                    {
                      "text-blue-600": isActive,
                      "text-green-600": isCompleted,
                      "text-red-600": isError,
                      "text-gray-400": !isActive && !isCompleted && !isError,
                    }
                  )}>
                    {getStageStatus(stage)}
                  </span>
                </div>
                
                {isError && stage.errorMessage && (
                  <p className="text-xs text-red-600 mt-1">
                    {stage.errorMessage}
                  </p>
                )}
                
                {stage.completedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Completed at {new Date(stage.completedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
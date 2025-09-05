"use client";

import { useState, useCallback, type DragEvent } from "react";
import { clsx } from "clsx";

interface UploadZoneProps {
  onFileUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  className?: string;
}

export function UploadZone({
  onFileUpload,
  isUploading,
  acceptedTypes = [".pdf"],
  maxSize = 50,
  className,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      if (!file.type.includes("pdf")) {
        return "Only PDF files are accepted";
      }

      // Check file size (convert MB to bytes)
      const maxSizeBytes = maxSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return `File size must be less than ${maxSize}MB`;
      }

      return null;
    },
    [maxSize]
  );

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      try {
        await onFileUpload(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    },
    [onFileUpload, validateFile]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0 && files[0]) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0 && files[0]) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  return (
    <div className={clsx("w-full", className)}>
      <div
        className={clsx(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          {
            "border-blue-400 bg-blue-50": isDragOver && !isUploading,
            "border-gray-300 hover:border-gray-400": !isDragOver && !isUploading,
            "border-gray-200 bg-gray-50": isUploading,
          }
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleFileInput}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            {isUploading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            ) : (
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isUploading ? "Processing..." : "Upload your research paper"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isUploading
                ? "Please wait while we process your PDF"
                : `Drag and drop a PDF file here, or click to select (max ${maxSize}MB)`}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
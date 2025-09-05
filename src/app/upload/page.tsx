"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadZone } from "~/components/ui/upload-zone";
import { useFileUpload } from "~/hooks/use-file-upload";

export default function UploadPage() {
  const router = useRouter();
  const [uploadResult, setUploadResult] = useState<any>(null);

  const { uploadFile, isUploading, error } = useFileUpload({
    onSuccess: (result) => {
      setUploadResult(result);
      // Redirect to project view after successful upload
      if (result.project?.id) {
        setTimeout(() => {
          router.push(`/projects/${result.project!.id}`);
        }, 2000);
      }
    },
    onError: (error) => {
      console.error("Upload failed:", error);
    },
  });

  const handleFileUpload = async (file: File) => {
    await uploadFile(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Upload Research Paper
          </h1>
          <p className="text-lg text-gray-600">
            Transform your academic research into working code automatically
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <UploadZone
            onFileUpload={handleFileUpload}
            isUploading={isUploading}
            maxSize={50}
          />

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Upload Failed
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {uploadResult && uploadResult.success && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Upload Successful!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Your paper "{uploadResult.project?.title}" has been uploaded successfully.
                      Redirecting to processing view...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            What happens next?
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-medium">
                1
              </div>
              <p>Your PDF will be processed to extract text and metadata</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-medium">
                2
              </div>
              <p>AI agents will analyze the research and identify key concepts</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-medium">
                3
              </div>
              <p>The system will generate a complete, executable codebase</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-medium">
                4
              </div>
              <p>You'll receive a downloadable ZIP file with all project files</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
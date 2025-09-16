'use client';

import { useEffect, useState } from 'react';
import { Button } from './button';
import { Card } from './card';

export interface FilePreview {
	filePath: string;
	fileType: string;
	content: string;
	size: number;
	language?: string;
}

export interface FilePreviewProps {
	projectId: string;
	onClose?: () => void;
}

export function FilePreview({ projectId, onClose }: FilePreviewProps) {
	const [files, setFiles] = useState<FilePreview[]>([]);
	const [selectedFile, setSelectedFile] = useState<FilePreview | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchFiles();
	}, [projectId]);

	const fetchFiles = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch(`/api/projects/${projectId}/files`);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to fetch files');
			}

			setFiles(data.files);
			if (data.files.length > 0) {
				setSelectedFile(data.files[0]);
			}
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Failed to load files');
		} finally {
			setLoading(false);
		}
	};

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	const getFileIcon = (filePath: string): string => {
		const extension = filePath.split('.').pop()?.toLowerCase();
		const iconMap: Record<string, string> = {
			py: '🐍',
			js: '📜',
			ts: '📘',
			jsx: '⚛️',
			tsx: '⚛️',
			html: '🌐',
			css: '🎨',
			json: '📋',
			md: '📝',
			txt: '📄',
			yml: '⚙️',
			yaml: '⚙️',
			dockerfile: '🐳',
			sh: '💻',
			sql: '🗄️',
		};
		return iconMap[extension || ''] || '📄';
	};

	if (loading) {
		return (
			<Card className="p-6">
				<div className="flex h-64 items-center justify-center">
					<div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2"></div>
					<span className="ml-2">Loading files...</span>
				</div>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="p-6">
				<div className="text-center">
					<div className="mb-4 text-red-600">❌ {error}</div>
					<Button onClick={fetchFiles} variant="outline">
						Retry
					</Button>
				</div>
			</Card>
		);
	}

	if (files.length === 0) {
		return (
			<Card className="p-6">
				<div className="text-center text-gray-500">No files available for preview</div>
			</Card>
		);
	}

	return (
		<div className="grid h-[600px] grid-cols-1 gap-4 lg:grid-cols-4">
			{/* File List */}
			<Card className="overflow-y-auto p-4 lg:col-span-1">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="font-semibold">Files ({files.length})</h3>
					{onClose && (
						<Button onClick={onClose} variant="ghost" size="sm">
							✕
						</Button>
					)}
				</div>

				<div className="space-y-2">
					{files.map((file, index) => (
						<div
							key={index}
							className={`cursor-pointer rounded p-2 transition-colors ${
								selectedFile?.filePath === file.filePath
									? 'border-blue-300 bg-blue-100'
									: 'hover:bg-gray-100'
							}`}
							onClick={() => setSelectedFile(file)}
						>
							<div className="flex items-center space-x-2">
								<span className="text-lg">{getFileIcon(file.filePath)}</span>
								<div className="min-w-0 flex-1">
									<div className="truncate font-medium text-sm">
										{file.filePath.split('/').pop()}
									</div>
									<div className="text-gray-500 text-xs">{formatFileSize(file.size)}</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</Card>

			{/* File Content */}
			<Card className="overflow-hidden p-4 lg:col-span-3">
				{selectedFile ? (
					<div className="flex h-full flex-col">
						<div className="mb-4 flex items-center justify-between border-b pb-2">
							<div>
								<h3 className="font-semibold">{selectedFile.filePath}</h3>
								<div className="text-gray-500 text-sm">
									{selectedFile.language} • {formatFileSize(selectedFile.size)}
								</div>
							</div>
							<Button
								onClick={() => {
									navigator.clipboard.writeText(selectedFile.content);
								}}
								variant="outline"
								size="sm"
							>
								📋 Copy
							</Button>
						</div>

						<div className="flex-1 overflow-auto">
							<pre className="h-full overflow-auto rounded border bg-gray-50 p-4 text-sm">
								<code className={`language-${selectedFile.language}`}>{selectedFile.content}</code>
							</pre>
						</div>
					</div>
				) : (
					<div className="flex h-full items-center justify-center text-gray-500">
						Select a file to preview
					</div>
				)}
			</Card>
		</div>
	);
}

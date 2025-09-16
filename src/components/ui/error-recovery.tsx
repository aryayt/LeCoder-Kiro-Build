'use client';
import { Button } from './button';
import { Card } from './card';

export interface ErrorRecoveryProps {
	error: Error | string;
	onRetry?: () => void;
	onReset?: () => void;
	showDetails?: boolean;
	suggestions?: string[];
}

export function ErrorRecovery({
	error,
	onRetry,
	onReset,
	showDetails = false,
	suggestions = [],
}: ErrorRecoveryProps) {
	const errorMessage = typeof error === 'string' ? error : error.message;
	const errorStack = typeof error === 'string' ? undefined : error.stack;

	const getErrorSuggestions = (message: string): string[] => {
		const lowerMessage = message.toLowerCase();

		if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
			return [
				'Check your internet connection',
				'Try refreshing the page',
				'Wait a moment and try again',
			];
		}

		if (lowerMessage.includes('file') || lowerMessage.includes('upload')) {
			return [
				'Make sure the file is a valid PDF',
				'Check that the file size is under 50MB',
				'Try uploading a different file',
			];
		}

		if (lowerMessage.includes('auth') || lowerMessage.includes('unauthorized')) {
			return [
				'Try logging out and logging back in',
				'Check if your session has expired',
				'Clear your browser cache and cookies',
			];
		}

		return [
			'Try refreshing the page',
			'Clear your browser cache',
			'Contact support if the problem persists',
		];
	};

	const allSuggestions = suggestions.length > 0 ? suggestions : getErrorSuggestions(errorMessage);

	return (
		<Card className="border-red-200 bg-red-50 p-6">
			<div className="flex items-start space-x-3">
				<div className="flex-shrink-0">
					<span className="text-2xl">⚠️</span>
				</div>
				<div className="flex-1">
					<h3 className="mb-2 font-semibold text-lg text-red-800">Something went wrong</h3>
					<p className="mb-4 text-red-700">{errorMessage}</p>

					{allSuggestions.length > 0 && (
						<div className="mb-4">
							<h4 className="mb-2 font-medium text-red-800">Try these solutions:</h4>
							<ul className="list-inside list-disc space-y-1 text-red-700">
								{allSuggestions.map((suggestion) => (
									<li key={suggestion} className="text-sm">
										{suggestion}
									</li>
								))}
							</ul>
						</div>
					)}

					<div className="flex space-x-2">
						{onRetry && (
							<Button onClick={onRetry} variant="outline" size="sm">
								Try Again
							</Button>
						)}
						{onReset && (
							<Button onClick={onReset} variant="outline" size="sm">
								Start Over
							</Button>
						)}
						<Button onClick={() => window.location.reload()} variant="outline" size="sm">
							Refresh Page
						</Button>
					</div>

					{showDetails && errorStack && (
						<details className="mt-4">
							<summary className="cursor-pointer text-red-700 text-sm hover:text-red-800">
								Technical Details
							</summary>
							<pre className="mt-2 max-h-40 overflow-auto rounded bg-red-100 p-3 text-xs">
								{errorStack}
							</pre>
						</details>
					)}
				</div>
			</div>
		</Card>
	);
}

export function NetworkErrorRecovery({ onRetry }: { onRetry?: () => void }) {
	return (
		<ErrorRecovery
			error="Network connection failed"
			onRetry={onRetry}
			suggestions={[
				'Check your internet connection',
				"Make sure you're not behind a firewall",
				'Try switching to a different network',
				'Wait a moment and try again',
			]}
		/>
	);
}

export function UploadErrorRecovery({
	error,
	onRetry,
}: {
	error: string;
	onRetry?: () => void;
}) {
	return (
		<ErrorRecovery
			error={error}
			onRetry={onRetry}
			suggestions={[
				'Make sure the file is a valid PDF',
				'Check that the file size is under 50MB',
				'Ensure the PDF is not password protected',
				'Try uploading a different file',
			]}
		/>
	);
}

export function ProcessingErrorRecovery({
	error,
	onRetry,
	onReset,
}: {
	error: string;
	onRetry?: () => void;
	onReset?: () => void;
}) {
	return (
		<ErrorRecovery
			error={error}
			onRetry={onRetry}
			onReset={onReset}
			suggestions={[
				'The AI service might be temporarily unavailable',
				'Try again in a few minutes',
				'Check if the uploaded PDF is readable',
				'Contact support if the problem persists',
			]}
		/>
	);
}

'use client';

import type React from 'react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './button';
import { Card } from './card';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('Error caught by boundary:', error, errorInfo);
		this.props.onError?.(error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<Card className="m-4 border-red-200 bg-red-50 p-6">
					<div className="text-center">
						<h2 className="mb-2 font-semibold text-lg text-red-800">Something went wrong</h2>
						<p className="mb-4 text-red-600">
							We encountered an unexpected error. Please try refreshing the page.
						</p>
						<div className="space-x-2">
							<Button onClick={() => window.location.reload()} variant="outline">
								Refresh Page
							</Button>
							<Button
								onClick={() => this.setState({ hasError: false, error: undefined })}
								variant="default"
							>
								Try Again
							</Button>
						</div>
						{process.env.NODE_ENV === 'development' && this.state.error && (
							<details className="mt-4 text-left">
								<summary className="cursor-pointer text-red-700 text-sm">
									Error Details (Development)
								</summary>
								<pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs">
									{this.state.error.stack}
								</pre>
							</details>
						)}
					</div>
				</Card>
			);
		}

		return this.props.children;
	}
}

// Hook-based error boundary for functional components
export function withErrorBoundary<P extends object>(
	Component: React.ComponentType<P>,
	fallback?: ReactNode
) {
	return function WrappedComponent(props: P) {
		return (
			<ErrorBoundary fallback={fallback}>
				<Component {...props} />
			</ErrorBoundary>
		);
	};
}

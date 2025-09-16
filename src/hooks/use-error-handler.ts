'use client';

import { useCallback, useState } from 'react';
import { useToast } from '~/components/ui/toast';

export interface ErrorHandlerOptions {
	showToast?: boolean;
	logError?: boolean;
	retryable?: boolean;
	onError?: (error: Error) => void;
}

export interface ErrorState {
	error: Error | null;
	isRetrying: boolean;
	retryCount: number;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
	const { addToast } = useToast();
	const [errorState, setErrorState] = useState<ErrorState>({
		error: null,
		isRetrying: false,
		retryCount: 0,
	});

	const handleError = useCallback(
		(error: Error | string, context?: string) => {
			const errorObj = typeof error === 'string' ? new Error(error) : error;

			// Log error if enabled
			if (options.logError !== false) {
				console.error(`Error${context ? ` in ${context}` : ''}:`, errorObj);
			}

			// Update error state
			setErrorState((prev) => ({
				...prev,
				error: errorObj,
				isRetrying: false,
			}));

			// Show toast notification if enabled
			if (options.showToast !== false) {
				addToast({
					type: 'error',
					title: 'Error',
					description: errorObj.message,
					duration: 5000,
				});
			}

			// Call custom error handler
			options.onError?.(errorObj);
		},
		[addToast, options]
	);

	const clearError = useCallback(() => {
		setErrorState({
			error: null,
			isRetrying: false,
			retryCount: 0,
		});
	}, []);

	const retry = useCallback(
		async (operation: () => Promise<void>) => {
			if (!options.retryable) {
				throw new Error('This operation is not retryable');
			}

			setErrorState((prev) => ({
				...prev,
				isRetrying: true,
				retryCount: prev.retryCount + 1,
			}));

			try {
				await operation();
				clearError();
			} catch (error) {
				handleError(error as Error, 'retry');
			}
		},
		[options.retryable, handleError, clearError]
	);

	const withErrorHandling = useCallback(
		<T extends any[], R>(fn: (...args: T) => Promise<R>, context?: string) => {
			return async (...args: T): Promise<R | undefined> => {
				try {
					clearError();
					return await fn(...args);
				} catch (error) {
					handleError(error as Error, context);
					return undefined;
				}
			};
		},
		[handleError, clearError]
	);

	return {
		error: errorState.error,
		isRetrying: errorState.isRetrying,
		retryCount: errorState.retryCount,
		handleError,
		clearError,
		retry,
		withErrorHandling,
	};
}

'use client';

import { useEffect } from 'react';

interface ConfirmationDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	type?: 'danger' | 'warning' | 'info';
	isLoading?: boolean;
}

export function ConfirmationDialog({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	type = 'danger',
	isLoading = false,
}: ConfirmationDialogProps) {
	// Handle escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen && !isLoading) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
			// Prevent body scroll
			document.body.style.overflow = 'hidden';
		}

		return () => {
			document.removeEventListener('keydown', handleEscape);
			document.body.style.overflow = 'unset';
		};
	}, [isOpen, isLoading, onClose]);

	if (!isOpen) return null;

	const getTypeStyles = () => {
		switch (type) {
			case 'danger':
				return {
					iconColor: 'text-red-600',
					iconBg: 'bg-red-100',
					confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
				};
			case 'warning':
				return {
					iconColor: 'text-yellow-600',
					iconBg: 'bg-yellow-100',
					confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
				};
			case 'info':
				return {
					iconColor: 'text-blue-600',
					iconBg: 'bg-blue-100',
					confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
				};
		}
	};

	const styles = getTypeStyles();

	const getIcon = () => {
		switch (type) {
			case 'danger':
				return (
					<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<title>Danger</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
				);
			case 'warning':
				return (
					<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<title>Warning</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				);
			case 'info':
				return (
					<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<title>Info</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				);
		}
	};

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
				onClick={!isLoading ? onClose : undefined}
			/>

			{/* Dialog */}
			<div className="flex min-h-full items-center justify-center p-4">
				<div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all">
					{/* Icon */}
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full">
						<div className={`rounded-full p-2 ${styles.iconBg}`}>
							<div className={styles.iconColor}>{getIcon()}</div>
						</div>
					</div>

					{/* Content */}
					<div className="mt-4 text-center">
						<h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
						<div className="mt-2">
							<p className="text-gray-500 text-sm">{message}</p>
						</div>
					</div>

					{/* Actions */}
					<div className="mt-6 flex space-x-3">
						<button
							type="button"
							onClick={onClose}
							disabled={isLoading}
							className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{cancelText}
						</button>
						<button
							type="button"
							onClick={onConfirm}
							disabled={isLoading}
							className={`flex-1 rounded-md px-4 py-2 font-medium text-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${styles.confirmButton}`}
						>
							{isLoading ? (
								<div className="flex items-center justify-center">
									<svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
										<title>Loading</title>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									Loading...
								</div>
							) : (
								confirmText
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

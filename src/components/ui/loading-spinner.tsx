import type React from 'react';

interface LoadingSpinnerProps {
	size?: 'sm' | 'md' | 'lg';
	className?: string;
	text?: string;
}

export function LoadingSpinner({ size = 'md', className = '', text }: LoadingSpinnerProps) {
	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-6 h-6',
		lg: 'w-8 h-8',
	};

	return (
		<div className={`flex items-center justify-center ${className}`}>
			<div className="flex flex-col items-center space-y-2">
				<div
					className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`}
				/>
				{text && <p className="text-gray-600 text-sm">{text}</p>}
			</div>
		</div>
	);
}

export function LoadingOverlay({
	isVisible,
	text = 'Loading...',
}: {
	isVisible: boolean;
	text?: string;
}) {
	if (!isVisible) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="rounded-lg bg-white p-6 shadow-lg">
				<LoadingSpinner size="lg" text={text} />
			</div>
		</div>
	);
}

export function LoadingButton({
	isLoading,
	children,
	...props
}: {
	isLoading: boolean;
	children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			{...props}
			disabled={isLoading || props.disabled}
			className={`flex items-center justify-center space-x-2 ${props.className || ''}`}
		>
			{isLoading && <LoadingSpinner size="sm" />}
			<span>{children}</span>
		</button>
	);
}

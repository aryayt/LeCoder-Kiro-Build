'use client';

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { Button } from './button';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: string;
	type: ToastType;
	title: string;
	description?: string;
	duration?: number;
	action?: {
		label: string;
		onClick: () => void;
	};
}

interface ToastContextType {
	toasts: Toast[];
	addToast: (toast: Omit<Toast, 'id'>) => void;
	removeToast: (id: string) => void;
	clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToast must be used within a ToastProvider');
	}
	return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const addToast = (toast: Omit<Toast, 'id'>) => {
		const id = Math.random().toString(36).substr(2, 9);
		const newToast = { ...toast, id };
		setToasts((prev) => [...prev, newToast]);

		// Auto-remove toast after duration
		const duration = toast.duration ?? 5000;
		if (duration > 0) {
			setTimeout(() => {
				removeToast(id);
			}, duration);
		}
	};

	const removeToast = (id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	};

	const clearToasts = () => {
		setToasts([]);
	};

	return (
		<ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
			{children}
			<ToastContainer toasts={toasts} onRemove={removeToast} />
		</ToastContext.Provider>
	);
}

function ToastContainer({
	toasts,
	onRemove,
}: {
	toasts: Toast[];
	onRemove: (id: string) => void;
}) {
	if (toasts.length === 0) {
		return null;
	}

	return (
		<div className="fixed top-4 right-4 z-50 max-w-sm space-y-2">
			{toasts.map((toast) => (
				<ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
			))}
		</div>
	);
}

function ToastItem({
	toast,
	onRemove,
}: {
	toast: Toast;
	onRemove: (id: string) => void;
}) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setIsVisible(true);
	}, []);

	const handleRemove = () => {
		setIsVisible(false);
		setTimeout(() => onRemove(toast.id), 150);
	};

	const getToastStyles = () => {
		const baseStyles = 'p-4 rounded-lg shadow-lg border transition-all duration-150 ease-in-out';

		if (!isVisible) {
			return `${baseStyles} opacity-0 translate-x-full`;
		}

		switch (toast.type) {
			case 'success':
				return `${baseStyles} bg-green-50 border-green-200 text-green-800`;
			case 'error':
				return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
			case 'warning':
				return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`;
			case 'info':
				return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
			default:
				return `${baseStyles} bg-gray-50 border-gray-200 text-gray-800`;
		}
	};

	const getIcon = () => {
		switch (toast.type) {
			case 'success':
				return '✓';
			case 'error':
				return '✕';
			case 'warning':
				return '⚠';
			case 'info':
				return 'ℹ';
			default:
				return '';
		}
	};

	return (
		<div className={getToastStyles()}>
			<div className="flex items-start justify-between">
				<div className="flex items-start space-x-2">
					<span className="text-lg">{getIcon()}</span>
					<div className="flex-1">
						<h4 className="font-medium">{toast.title}</h4>
						{toast.description && <p className="mt-1 text-sm opacity-90">{toast.description}</p>}
					</div>
				</div>
				<button
					onClick={handleRemove}
					className="ml-2 text-lg opacity-60 transition-opacity hover:opacity-100"
				>
					×
				</button>
			</div>
			{toast.action && (
				<div className="mt-3">
					<Button size="sm" variant="outline" onClick={toast.action.onClick}>
						{toast.action.label}
					</Button>
				</div>
			)}
		</div>
	);
}

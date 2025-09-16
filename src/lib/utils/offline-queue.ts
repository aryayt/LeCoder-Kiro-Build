'use client';

export interface QueuedOperation {
	id: string;
	type: string;
	data: any;
	timestamp: number;
	retryCount: number;
	maxRetries: number;
}

export class OfflineQueue {
	private queue: QueuedOperation[] = [];
	private isProcessing = false;
	private storageKey = 'lecoder_offline_queue';

	constructor() {
		this.loadFromStorage();
		this.setupNetworkListeners();
	}

	private loadFromStorage() {
		if (typeof window === 'undefined') {
			return;
		}

		try {
			const stored = localStorage.getItem(this.storageKey);
			if (stored) {
				this.queue = JSON.parse(stored);
			}
		} catch (error) {
			console.error('Failed to load offline queue:', error);
		}
	}

	private saveToStorage() {
		if (typeof window === 'undefined') {
			return;
		}

		try {
			localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
		} catch (error) {
			console.error('Failed to save offline queue:', error);
		}
	}

	private setupNetworkListeners() {
		if (typeof window === 'undefined') {
			return;
		}

		window.addEventListener('online', () => {
			this.processQueue();
		});
	}

	addOperation(type: string, data: any, maxRetries = 3): string {
		const operation: QueuedOperation = {
			id: Math.random().toString(36).substr(2, 9),
			type,
			data,
			timestamp: Date.now(),
			retryCount: 0,
			maxRetries,
		};

		this.queue.push(operation);
		this.saveToStorage();

		// Try to process immediately if online
		if (navigator.onLine) {
			this.processQueue();
		}

		return operation.id;
	}

	removeOperation(id: string) {
		this.queue = this.queue.filter((op) => op.id !== id);
		this.saveToStorage();
	}

	async processQueue() {
		if (this.isProcessing || !navigator.onLine || this.queue.length === 0) {
			return;
		}

		this.isProcessing = true;

		const operations = [...this.queue];

		for (const operation of operations) {
			try {
				await this.executeOperation(operation);
				this.removeOperation(operation.id);
			} catch (error) {
				console.error(`Failed to execute operation ${operation.id}:`, error);

				operation.retryCount++;
				if (operation.retryCount >= operation.maxRetries) {
					console.error(`Operation ${operation.id} exceeded max retries, removing from queue`);
					this.removeOperation(operation.id);
				} else {
					this.saveToStorage();
				}
			}
		}

		this.isProcessing = false;
	}

	private async executeOperation(operation: QueuedOperation): Promise<void> {
		// This would be implemented based on the specific operation types
		// For now, we'll just simulate the operation
		switch (operation.type) {
			case 'upload':
				return this.executeUpload(operation.data);
			case 'project_update':
				return this.executeProjectUpdate(operation.data);
			default:
				throw new Error(`Unknown operation type: ${operation.type}`);
		}
	}

	private async executeUpload(data: any): Promise<void> {
		// Implement actual upload logic here
		const response = await fetch('/api/upload', {
			method: 'POST',
			body: data.formData,
		});

		if (!response.ok) {
			throw new Error(`Upload failed: ${response.statusText}`);
		}
	}

	private async executeProjectUpdate(data: any): Promise<void> {
		// Implement project update logic here
		const response = await fetch(`/api/projects/${data.projectId}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data.updates),
		});

		if (!response.ok) {
			throw new Error(`Project update failed: ${response.statusText}`);
		}
	}

	getQueueStatus() {
		return {
			totalOperations: this.queue.length,
			isProcessing: this.isProcessing,
			operations: this.queue.map((op) => ({
				id: op.id,
				type: op.type,
				timestamp: op.timestamp,
				retryCount: op.retryCount,
				maxRetries: op.maxRetries,
			})),
		};
	}

	clearQueue() {
		this.queue = [];
		this.saveToStorage();
	}
}

// Singleton instance
export const offlineQueue = new OfflineQueue();

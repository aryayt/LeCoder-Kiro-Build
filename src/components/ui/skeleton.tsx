interface SkeletonProps {
	className?: string;
	width?: string | number;
	height?: string | number;
	rounded?: boolean;
}

export function Skeleton({ className = '', width, height, rounded = false }: SkeletonProps) {
	const style = {
		width: typeof width === 'number' ? `${width}px` : width,
		height: typeof height === 'number' ? `${height}px` : height,
	};

	return (
		<div
			className={`animate-pulse bg-gray-200 ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
			style={style}
		/>
	);
}

// Predefined skeleton components for common use cases
export function SkeletonText({
	lines = 1,
	className = '',
}: { lines?: number; className?: string }) {
	return (
		<div className={`space-y-2 ${className}`}>
			{Array.from({ length: lines }).map((_, i) => (
				<Skeleton key={`skeleton-text-${i}`} height={16} width={i === lines - 1 ? '75%' : '100%'} />
			))}
		</div>
	);
}

export function SkeletonCard({ className = '' }: { className?: string }) {
	return (
		<div className={`rounded-lg border p-4 ${className}`}>
			<div className="mb-3 flex items-center space-x-3">
				<Skeleton width={40} height={40} rounded />
				<div className="flex-1">
					<Skeleton height={16} width="60%" />
					<Skeleton height={12} width="40%" className="mt-2" />
				</div>
			</div>
			<SkeletonText lines={3} />
		</div>
	);
}

export function SkeletonProjectCard({ className = '' }: { className?: string }) {
	return (
		<div className={`rounded-lg border p-6 ${className}`}>
			<div className="mb-4 flex items-start justify-between">
				<div className="flex-1">
					<Skeleton height={20} width="70%" />
					<Skeleton height={14} width="50%" className="mt-2" />
				</div>
				<Skeleton width={80} height={32} />
			</div>
			<div className="mb-4 space-y-2">
				<Skeleton height={12} width="100%" />
				<Skeleton height={12} width="85%" />
				<Skeleton height={12} width="60%" />
			</div>
			<div className="flex items-center justify-between">
				<Skeleton width={100} height={20} />
				<div className="flex space-x-2">
					<Skeleton width={80} height={32} />
					<Skeleton width={80} height={32} />
				</div>
			</div>
		</div>
	);
}

export function SkeletonProgressTracker({ className = '' }: { className?: string }) {
	return (
		<div className={`space-y-4 ${className}`}>
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={`skeleton-progress-${i}`} className="flex items-center space-x-3">
					<Skeleton width={24} height={24} rounded />
					<div className="flex-1">
						<Skeleton height={16} width="40%" />
						<Skeleton height={12} width="60%" className="mt-1" />
					</div>
					<Skeleton width={60} height={20} />
				</div>
			))}
		</div>
	);
}

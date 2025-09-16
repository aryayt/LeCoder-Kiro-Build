import { clsx } from 'clsx';

interface BadgeProps {
	children: React.ReactNode;
	variant?: 'default' | 'secondary' | 'destructive' | 'outline';
	className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
	return (
		<span
			className={clsx(
				'inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs',
				{
					'bg-blue-100 text-blue-800': variant === 'default',
					'bg-gray-100 text-gray-800': variant === 'secondary',
					'bg-red-100 text-red-800': variant === 'destructive',
					'border border-gray-200 text-gray-700': variant === 'outline',
				},
				className
			)}
		>
			{children}
		</span>
	);
}

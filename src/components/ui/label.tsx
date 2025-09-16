import { clsx } from 'clsx';
import { forwardRef } from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
	className?: string;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => {
	return (
		<label
			ref={ref}
			className={clsx(
				'font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
				className
			)}
			{...props}
		/>
	);
});

Label.displayName = 'Label';

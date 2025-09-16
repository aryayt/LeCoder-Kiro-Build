import Link from 'next/link';
import { PasswordResetForm } from '~/components/auth/password-reset-form';

export default function ForgotPasswordPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				<div>
					<h2 className="mt-6 text-center font-extrabold text-3xl text-gray-900">
						Reset your password
					</h2>
					<p className="mt-2 text-center text-gray-600 text-sm">
						Enter your email address and we'll send you a link to reset your password.
					</p>
				</div>
				<PasswordResetForm />
				<div className="text-center">
					<Link
						href="/auth/login"
						className="font-medium text-indigo-600 text-sm hover:text-indigo-500"
					>
						Back to sign in
					</Link>
				</div>
			</div>
		</div>
	);
}

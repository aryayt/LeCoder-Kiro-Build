import Link from "next/link";
import { RegisterForm } from "~/components/auth/register-form";

export default function RegisterPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				<div>
					<h2 className="mt-6 text-center font-extrabold text-3xl text-gray-900">
						Create your account
					</h2>
					<p className="mt-2 text-center text-gray-600 text-sm">
						Or{" "}
						<Link
							href="/auth/login"
							className="font-medium text-indigo-600 hover:text-indigo-500"
						>
							sign in to your existing account
						</Link>
					</p>
				</div>
				<RegisterForm />
			</div>
		</div>
	);
}

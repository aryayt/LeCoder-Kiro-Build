import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PasswordChangeForm } from "~/components/auth/password-change-form";
import { ProfileForm } from "~/components/auth/profile-form";
import { auth } from "~/lib/auth";

export default async function ProfilePage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/auth/login");
	}

	return (
		<div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-2xl space-y-6">
				{/* Profile Information */}
				<div className="rounded-lg bg-white shadow">
					<div className="px-4 py-5 sm:p-6">
						<h1 className="mb-6 font-bold text-2xl text-gray-900">
							Profile Settings
						</h1>
						<ProfileForm user={session.user} />
					</div>
				</div>

				{/* Password Change */}
				<div className="rounded-lg bg-white shadow">
					<div className="px-4 py-5 sm:p-6">
						<h2 className="mb-6 font-bold text-gray-900 text-xl">
							Change Password
						</h2>
						<PasswordChangeForm />
					</div>
				</div>
			</div>
		</div>
	);
}

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ApiKeyManager } from "~/components/settings/api-key-manager";
import { auth } from "~/lib/auth";

export default async function SettingsPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/auth/login");
	}

	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<div className="mb-8">
				<h1 className="font-bold text-3xl">Settings</h1>
				<p className="mt-2 text-gray-600">
					Manage your account settings and API configurations
				</p>
			</div>

			<div className="space-y-8">
				{/* API Key Management Section */}
				<section>
					<ApiKeyManager />
				</section>

				{/* Future sections can be added here */}
				{/* 
        <section>
          <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
          // Account settings components
        </section>
        */}
			</div>
		</div>
	);
}

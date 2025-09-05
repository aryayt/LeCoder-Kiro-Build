import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/lib/auth";

export default async function DashboardPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/auth/login");
	}

	return (
		<div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-7xl">
				<div className="mb-8">
					<h1 className="font-bold text-3xl text-gray-900">
						Welcome back, {session.user.name || session.user.email}!
					</h1>
					<p className="mt-2 text-gray-600">
						Manage your research paper projects and track their progress.
					</p>
				</div>

				<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
					<div className="rounded-lg bg-white p-6 shadow">
						<h3 className="mb-2 font-medium text-gray-900 text-lg">
							Total Projects
						</h3>
						<p className="font-bold text-3xl text-indigo-600">0</p>
						<p className="text-gray-500 text-sm">No projects yet</p>
					</div>

					<div className="rounded-lg bg-white p-6 shadow">
						<h3 className="mb-2 font-medium text-gray-900 text-lg">
							In Progress
						</h3>
						<p className="font-bold text-3xl text-yellow-600">0</p>
						<p className="text-gray-500 text-sm">Currently processing</p>
					</div>

					<div className="rounded-lg bg-white p-6 shadow">
						<h3 className="mb-2 font-medium text-gray-900 text-lg">
							Completed
						</h3>
						<p className="font-bold text-3xl text-green-600">0</p>
						<p className="text-gray-500 text-sm">Ready for download</p>
					</div>
				</div>

				<div className="rounded-lg bg-white shadow">
					<div className="border-gray-200 border-b px-6 py-4">
						<h2 className="font-semibold text-gray-900 text-xl">
							Recent Projects
						</h2>
					</div>
					<div className="p-6">
						<div className="py-12 text-center">
							<svg
								className="mx-auto h-12 w-12 text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							<h3 className="mt-2 font-medium text-gray-900 text-sm">
								No projects
							</h3>
							<p className="mt-1 text-gray-500 text-sm">
								Get started by uploading your first research paper.
							</p>
							<div className="mt-6">
								<button
									type="button"
									className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-sm text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
								>
									Upload Paper
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

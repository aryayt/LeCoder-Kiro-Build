import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "~/lib/auth";

export default async function Home() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-900 to-purple-900 text-white">
			<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
				<div className="text-center">
					<h1 className="mb-6 font-extrabold text-5xl tracking-tight sm:text-[6rem]">
						<span className="text-white">Le</span>
						<span className="text-indigo-300">CodeR</span>
					</h1>
					<p className="mb-8 max-w-2xl text-indigo-200 text-xl">
						Transform academic research papers into working code repositories
						using AI. Upload your PDF, get complete, executable code with
						documentation.
					</p>
				</div>

				{session ? (
					<div className="flex flex-col items-center gap-6">
						<p className="text-indigo-200 text-lg">
							Welcome back, {session.user.name || session.user.email}!
						</p>
						<div className="flex gap-4">
							<Link
								href="/dashboard"
								className="rounded-lg bg-indigo-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
							>
								Go to Dashboard
							</Link>
							<Link
								href="/upload"
								className="rounded-lg bg-white/10 px-8 py-3 font-semibold text-white transition-colors hover:bg-white/20"
							>
								Upload Paper
							</Link>
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center gap-6">
						<div className="flex gap-4">
							<Link
								href="/auth/register"
								className="rounded-lg bg-indigo-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
							>
								Get Started
							</Link>
							<Link
								href="/auth/login"
								className="rounded-lg bg-white/10 px-8 py-3 font-semibold text-white transition-colors hover:bg-white/20"
							>
								Sign In
							</Link>
						</div>
						<p className="text-indigo-300 text-sm">
							No account required to try it out
						</p>
					</div>
				)}

				<div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 md:gap-8">
					<div className="flex flex-col items-center rounded-xl bg-white/5 p-6 text-center">
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500">
							<svg
								className="h-6 w-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Upload PDF</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
								/>
							</svg>
						</div>
						<h3 className="mb-2 font-bold text-xl">Upload PDF</h3>
						<p className="text-indigo-200">
							Simply drag and drop your research paper PDF to get started
						</p>
					</div>

					<div className="flex flex-col items-center rounded-xl bg-white/5 p-6 text-center">
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500">
							<svg
								className="h-6 w-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>AI Analysis</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
								/>
							</svg>
						</div>
						<h3 className="mb-2 font-bold text-xl">AI Analysis</h3>
						<p className="text-indigo-200">
							Our AI analyzes your paper through 6 stages to understand the
							research
						</p>
					</div>

					<div className="flex flex-col items-center rounded-xl bg-white/5 p-6 text-center">
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-500">
							<svg
								className="h-6 w-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Download Code</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
						</div>
						<h3 className="mb-2 font-bold text-xl">Download Code</h3>
						<p className="text-indigo-200">
							Get a complete, executable codebase with documentation and setup
							instructions
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}

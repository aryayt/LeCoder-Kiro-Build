"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export function LatestPost() {
	const [latestProject] = api.post.getLatest.useSuspenseQuery();

	const utils = api.useUtils();
	const [title, setTitle] = useState("");
	const [paperContent, setPaperContent] = useState("");
	const createProject = api.post.create.useMutation({
		onSuccess: async () => {
			await utils.post.invalidate();
			setTitle("");
			setPaperContent("");
		},
	});

	return (
		<div className="w-full max-w-xs">
			{latestProject ? (
				<p className="truncate">
					Your most recent project: {latestProject.title}
				</p>
			) : (
				<p>You have no projects yet.</p>
			)}
			<form
				onSubmit={(e) => {
					e.preventDefault();
					createProject.mutate({ title, paperContent });
				}}
				className="flex flex-col gap-2"
			>
				<input
					type="text"
					placeholder="Project Title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
				/>
				<textarea
					placeholder="Paper Content"
					value={paperContent}
					onChange={(e) => setPaperContent(e.target.value)}
					className="w-full rounded bg-white/10 px-4 py-2 text-white"
					rows={3}
				/>
				<button
					type="submit"
					className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
					disabled={createProject.isPending}
				>
					{createProject.isPending ? "Submitting..." : "Submit"}
				</button>
			</form>
		</div>
	);
}

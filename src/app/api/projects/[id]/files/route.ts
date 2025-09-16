import { type NextRequest, NextResponse } from 'next/server';
import { FileService } from '~/lib/services/file-service';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id: projectId } = await context.params;

		if (!projectId) {
			return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
		}

		const fileService = FileService.getInstance();

		// Get project files for preview
		const files = await fileService.getProjectFiles(projectId);

		return NextResponse.json({
			success: true,
			files,
			count: files.length,
			totalSize: files.reduce((sum, file) => sum + file.size, 0),
		});
	} catch (error) {
		console.error('Files API error:', error);
		return NextResponse.json({ error: 'Failed to fetch project files' }, { status: 500 });
	}
}

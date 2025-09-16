import { type NextRequest, NextResponse } from 'next/server';
import { FileService } from '~/lib/services/file-service';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id: projectId } = await context.params;

		if (!projectId) {
			return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
		}

		const fileService = FileService.getInstance();

		// Get download info first to validate project
		const downloadInfo = await fileService.getDownloadInfo(projectId);

		if (!downloadInfo) {
			return NextResponse.json({ error: 'Project not found' }, { status: 404 });
		}

		if (downloadInfo.status !== 'ready') {
			return NextResponse.json(
				{
					error: 'Project not ready for download',
					status: downloadInfo.status,
				},
				{ status: 400 }
			);
		}

		// Generate ZIP file
		const result = await fileService.generateProjectZip(projectId);

		if (!result.success || !result.buffer) {
			return NextResponse.json(
				{ error: result.error || 'Failed to generate download' },
				{ status: 500 }
			);
		}

		// Create filename
		const filename = `${downloadInfo.projectName.replace(/[^a-zA-Z0-9\-_]/g, '-')}.zip`;

		// Return ZIP file with proper headers
		return new NextResponse(result.buffer as BodyInit, {
			status: 200,
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename="${filename}"`,
				'Content-Length': result.buffer.length.toString(),
				'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
				'X-File-Count': result.fileCount.toString(),
				'X-Total-Size': result.totalSize.toString(),
			},
		});
	} catch (error) {
		console.error('Download API error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

// Handle HEAD requests for download info without generating the file
export async function HEAD(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id: projectId } = await context.params;

		if (!projectId) {
			return new NextResponse(null, { status: 400 });
		}

		const fileService = FileService.getInstance();
		const downloadInfo = await fileService.getDownloadInfo(projectId);

		if (!downloadInfo) {
			return new NextResponse(null, { status: 404 });
		}

		if (downloadInfo.status !== 'ready') {
			return new NextResponse(null, { status: 400 });
		}

		// Return headers without body
		return new NextResponse(null, {
			status: 200,
			headers: {
				'Content-Type': 'application/zip',
				'X-File-Count': downloadInfo.fileCount.toString(),
				'X-Total-Size': downloadInfo.totalSize.toString(),
				'X-Project-Status': downloadInfo.status,
				'Last-Modified': downloadInfo.lastModified.toUTCString(),
			},
		});
	} catch (error) {
		console.error('Download HEAD API error:', error);
		return new NextResponse(null, { status: 500 });
	}
}

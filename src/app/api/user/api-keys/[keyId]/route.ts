import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { ApiKeyService } from '~/lib/services/api-key-service';

/**
 * DELETE /api/user/api-keys/[keyId] - Delete an API key
 */
export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ keyId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
		}

		const { keyId } = await params;

		if (!keyId) {
			return NextResponse.json({ success: false, error: 'Key ID is required' }, { status: 400 });
		}

		await ApiKeyService.deleteApiKey(keyId, session.user.id);

		return NextResponse.json({
			success: true,
			message: 'API key deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting API key:', error);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to delete API key',
			},
			{ status: 500 }
		);
	}
}

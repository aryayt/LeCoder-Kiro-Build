import { NextRequest, NextResponse } from 'next/server';
import { cleanupOldData } from '../../../../../scripts/database-monitoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// This endpoint is called by Vercel cron jobs
export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron job request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🧹 Starting scheduled cleanup...');
    
    const result = await cleanupOldData(30); // Clean up data older than 30 days
    
    console.log('✅ Cleanup completed:', result);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }
  
  try {
    const result = await cleanupOldData(30);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
    
  } catch (error) {
    console.error('Cleanup failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
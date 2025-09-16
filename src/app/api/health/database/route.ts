import { NextResponse } from 'next/server';
import { checkDatabaseHealth, getDatabaseSize } from '../../../../../scripts/database-monitoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [health, size] = await Promise.all([
      checkDatabaseHealth(),
      getDatabaseSize(),
    ]);
    
    const response = {
      ...health,
      databaseSize: size,
      timestamp: new Date().toISOString(),
    };
    
    return NextResponse.json(response, {
      status: health.connectionStatus === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
  } catch (error) {
    console.error('Database health check failed:', error);
    
    return NextResponse.json(
      {
        connectionStatus: 'unhealthy',
        error: 'Database health check failed',
        timestamp: new Date().toISOString(),
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
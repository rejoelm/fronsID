import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'fronsciers-frontend',
      version: process.env.npm_package_version || '1.0.0',
      node: process.version,
      environment: process.env.NODE_ENV || 'development',
      railway: !!process.env.RAILWAY_ENVIRONMENT,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
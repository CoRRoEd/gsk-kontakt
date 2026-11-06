import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      data: {
        status: 'healthy',
        database: 'ok',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Healthcheck failed:', error);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Database unavailable',
        },
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const RENDER_HEALTH_URL = 'https://event-backend-29dm.onrender.com/api/health';

export async function GET() {
  try {
    const t0 = Date.now();
    const res = await fetch(RENDER_HEALTH_URL, {
      cache: 'no-store',
      headers: { 'User-Agent': 'VercelCron-RenderWarmUp/1.0' }
    });
    const status = res.status;
    const latencyMs = Date.now() - t0;

    return NextResponse.json({
      success: true,
      pinged: RENDER_HEALTH_URL,
      statusCode: status,
      latencyMs,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      pinged: RENDER_HEALTH_URL,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

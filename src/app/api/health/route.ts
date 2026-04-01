import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase';

const startedAt = Date.now();

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {};

  // Check Supabase connectivity
  try {
    const { error } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .limit(1);
    checks.supabase = error ? 'error' : 'ok';
  } catch {
    checks.supabase = 'error';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: 200 }
  );
}

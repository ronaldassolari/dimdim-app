import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    await sql`SELECT 1`;
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString(), db: 'connected' });
  } catch {
    return NextResponse.json({ status: 'error', timestamp: new Date().toISOString(), db: 'disconnected' }, { status: 503 });
  }
}

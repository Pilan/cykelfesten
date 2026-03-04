import { NextResponse } from 'next/server';
import { getOpenEvents } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const events = getOpenEvents();
  return NextResponse.json(events);
}

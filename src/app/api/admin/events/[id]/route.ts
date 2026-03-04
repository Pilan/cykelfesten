import { NextRequest, NextResponse } from 'next/server';
import { getEventForAdmin, updateEvent, deleteEvent, getHouseholds, getAssignments } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return unauthorized();
  const id = parseInt(params.id);
  const event = getEventForAdmin(id, session.adminId);
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const households = getHouseholds(id);
  const assignments = getAssignments(id);
  return NextResponse.json({ event, households, assignments });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return unauthorized();
  try {
    const id = parseInt(params.id);
    if (!getEventForAdmin(id, session.adminId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const body = await req.json();
    const event = updateEvent(id, body);
    return NextResponse.json(event);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Serverfel.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return unauthorized();
  try {
    const id = parseInt(params.id);
    if (!getEventForAdmin(id, session.adminId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    deleteEvent(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

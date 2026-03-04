import { NextRequest, NextResponse } from 'next/server';
import { getEventForAdmin, getHouseholds, saveAssignments, clearAssignments } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { runLottery } from '@/lib/lottery';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return unauthorized();
  try {
    const eventId = parseInt(params.id);
    if (!getEventForAdmin(eventId, session.adminId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const households = getHouseholds(eventId);
    const { assignments, warnings } = runLottery(households);

    if (assignments.length > 0) {
      saveAssignments(eventId, assignments);
    }

    return NextResponse.json({ assignments, warnings });
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return unauthorized();
  try {
    const eventId = parseInt(params.id);
    if (!getEventForAdmin(eventId, session.adminId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const { assignments } = await req.json();
    if (!Array.isArray(assignments)) {
      return NextResponse.json({ error: 'Ogiltiga data.' }, { status: 400 });
    }
    saveAssignments(eventId, assignments);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return unauthorized();
  try {
    const eventId = parseInt(params.id);
    if (!getEventForAdmin(eventId, session.adminId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    clearAssignments(eventId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

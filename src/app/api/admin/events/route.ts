import { NextRequest, NextResponse } from 'next/server';
import { getAllEvents, createEvent } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  const session = getSession();
  if (!session) return unauthorized();
  return NextResponse.json(getAllEvents(session.adminId));
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { title, date, description, location, max_participants, registration_open, starter_time, main_time, dessert_time } = body;
    if (!title || !date) {
      return NextResponse.json({ error: 'Titel och datum krävs.' }, { status: 400 });
    }
    const event = createEvent({
      admin_id: session.adminId,
      title,
      date,
      description: description || '',
      location: location || '',
      max_participants: max_participants ?? 50,
      registration_open: registration_open ?? 1,
      starter_time: starter_time || '17:00',
      main_time: main_time || '19:00',
      dessert_time: dessert_time || '21:00',
    });
    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

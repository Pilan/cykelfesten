import { NextRequest, NextResponse } from 'next/server';
import { getEventForAdmin, getEventTemplates, saveTemplate } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const eventId = parseInt(params.id);
  if (!getEventForAdmin(eventId, session.adminId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(getEventTemplates(eventId));
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const eventId = parseInt(params.id);
  if (!getEventForAdmin(eventId, session.adminId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    const body = await req.json() as Record<string, string>;
    const allowed = ['sms_advance', 'sms_host', 'sms_guest', 'email_subject', 'email_body'];
    for (const key of allowed) {
      if (typeof body[key] === 'string') {
        saveTemplate(eventId, key, body[key]);
      }
    }
    return NextResponse.json(getEventTemplates(eventId));
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

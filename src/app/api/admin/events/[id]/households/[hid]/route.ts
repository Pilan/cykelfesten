import { NextRequest, NextResponse } from 'next/server';
import { deleteHousehold, getHousehold, getEventForAdmin } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; hid: string } }
) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const eventId = parseInt(params.id);
    if (!getEventForAdmin(eventId, session.adminId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const hid = parseInt(params.hid);
    const household = getHousehold(hid);
    if (!household || household.event_id !== eventId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    deleteHousehold(hid);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

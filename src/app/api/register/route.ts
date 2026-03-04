import { NextRequest, NextResponse } from 'next/server';
import { getEvent, createHousehold } from '@/lib/db';
import { sendConfirmationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, members, address, email, phone, capacity, dietary } = body;

    if (!eventId || !members?.length || !address || !email || !phone || !capacity) {
      return NextResponse.json({ error: 'Saknade obligatoriska fält.' }, { status: 400 });
    }

    const event = getEvent(parseInt(eventId));
    if (!event) return NextResponse.json({ error: 'Event hittades inte.' }, { status: 404 });
    if (!event.registration_open) {
      return NextResponse.json({ error: 'Anmälan är stängd.' }, { status: 400 });
    }

    const household = createHousehold({
      event_id: event.id,
      members: JSON.stringify(members),
      address,
      email,
      phone,
      capacity: parseInt(capacity),
      dietary: dietary || '',
    });

    // Send confirmation email (non-blocking - don't fail registration if email fails)
    sendConfirmationEmail(event, household).catch((err) =>
      console.error('Failed to send confirmation email:', err)
    );

    return NextResponse.json({ ok: true, householdId: household.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

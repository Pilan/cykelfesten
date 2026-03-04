import { NextRequest, NextResponse } from 'next/server';
import { getEventForAdmin, getHouseholds, getAssignments, markSmsSent } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendHostSms, sendGuestSms } from '@/lib/sms';

type Course = 'starter' | 'main' | 'dessert';

const SMS_FIELD = {
  starter: 'sms_starter_sent',
  main: 'sms_main_sent',
  dessert: 'sms_dessert_sent',
} as const;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const eventId = parseInt(params.id);
    const { course } = await req.json() as { course: Course };

    if (!['starter', 'main', 'dessert'].includes(course)) {
      return NextResponse.json({ error: 'Ogiltig rätt.' }, { status: 400 });
    }

    const event = getEventForAdmin(eventId, session.adminId);
    if (!event) return NextResponse.json({ error: 'Event hittades inte.' }, { status: 404 });

    const households = getHouseholds(eventId);
    const assignments = getAssignments(eventId);
    if (assignments.length === 0) {
      return NextResponse.json({ error: 'Lottning ej genomförd.' }, { status: 400 });
    }

    const householdMap = new Map(households.map((h) => [h.id, h]));
    const courseTime = {
      starter: event.starter_time,
      main: event.main_time,
      dessert: event.dessert_time,
    }[course];

    const errors: string[] = [];
    await Promise.allSettled(
      assignments.map(async (a) => {
        const h = householdMap.get(a.household_id);
        if (!h) return;

        try {
          if (a.course === course) {
            // This household is hosting this course
            await sendHostSms(h.phone, course, courseTime);
          } else {
            // This household visits someone for this course
            const visitId =
              course === 'starter'
                ? a.visits_starter
                : course === 'main'
                ? a.visits_main
                : a.visits_dessert;

            if (visitId) {
              const host = householdMap.get(visitId);
              if (host) {
                await sendGuestSms(h.phone, course, host.address, courseTime);
              }
            }
          }
        } catch (err) {
          errors.push(`Hushåll ${a.household_id}: ${err}`);
        }
      })
    );

    markSmsSent(eventId, SMS_FIELD[course]);

    if (errors.length > 0) {
      return NextResponse.json({ ok: true, errors });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

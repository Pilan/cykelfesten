import { NextRequest, NextResponse } from 'next/server';
import { getEventForAdmin, getHouseholds, getAssignments, markSmsSent } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendAdvanceSms } from '@/lib/sms';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const eventId = parseInt(params.id);
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
    };

    // For each host: count visiting people and collect dietary info per course
    const visitorPeople = new Map<string, number>();   // key: `${hostId}-${course}`
    const visitorDietary = new Map<string, string[]>(); // key: `${hostId}-${course}`
    for (const a of assignments) {
      const visitor = householdMap.get(a.household_id);
      if (!visitor) continue;
      const memberCount = (JSON.parse(visitor.members) as string[]).length;

      const addVisit = (hostId: number | null, course: string) => {
        if (!hostId) return;
        const key = `${hostId}-${course}`;
        visitorPeople.set(key, (visitorPeople.get(key) ?? 0) + memberCount);
        if (visitor.dietary) {
          const list = visitorDietary.get(key) ?? [];
          list.push(visitor.dietary);
          visitorDietary.set(key, list);
        }
      };

      addVisit(a.visits_starter, 'starter');
      addVisit(a.visits_main, 'main');
      addVisit(a.visits_dessert, 'dessert');
    }

    const errors: string[] = [];
    await Promise.allSettled(
      assignments.map(async (a) => {
        const h = householdMap.get(a.household_id);
        if (!h) return;
        const key = `${a.household_id}-${a.course}`;
        const guestCount = visitorPeople.get(key) ?? 0;
        const dietaryList = visitorDietary.get(key) ?? [];
        try {
          await sendAdvanceSms(h.phone, event.date, a.course, courseTime[a.course], guestCount, dietaryList);
        } catch (err) {
          errors.push(`Hushåll ${a.household_id}: ${err}`);
        }
      })
    );

    markSmsSent(eventId, 'sms_advance_sent');

    if (errors.length > 0) {
      return NextResponse.json({ ok: true, errors });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

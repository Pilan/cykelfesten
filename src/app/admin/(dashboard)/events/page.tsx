import Link from 'next/link';
import { getAllEvents, getHouseholds } from '@/lib/db';
import { getSession } from '@/lib/auth';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default function EventsListPage() {
  const session = getSession()!;
  const events = getAllEvents(session.adminId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Alla event</h1>
        <Link
          href="/admin/events/new"
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          + Nytt event
        </Link>
      </div>

      {events.length === 0 ? (
        <Card className="p-8 text-center text-gray-400">Inga event ännu.</Card>
      ) : (
        <div className="grid gap-3">
          {events.map((event) => {
            const hCount = getHouseholds(event.id).length;
            const date = new Date(event.date).toLocaleDateString('sv-SE');
            return (
              <Card key={event.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{event.title}</span>
                      <Badge variant={event.registration_open ? 'green' : 'gray'}>
                        {event.registration_open ? 'Öppen' : 'Stängd'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{date} · {hCount} hushåll</p>
                  </div>
                  <Link href={`/admin/events/${event.id}`} className="text-green-600 hover:underline text-sm font-medium">
                    Hantera →
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

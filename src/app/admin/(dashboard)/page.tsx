import Link from 'next/link';
import { getAllEvents, getHouseholds, getAssignments } from '@/lib/db';
import { getSession } from '@/lib/auth';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const session = getSession()!;
  const events = getAllEvents(session.adminId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/admin/events/new"
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          + Nytt event
        </Link>
      </div>

      {events.length === 0 ? (
        <Card className="p-8 text-center text-gray-400">
          <p className="text-lg mb-2">Inga event skapade ännu.</p>
          <Link href="/admin/events/new" className="text-green-600 hover:underline text-sm">
            Skapa ditt första event →
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => {
            const households = getHouseholds(event.id);
            const assignments = getAssignments(event.id);
            const date = new Date(event.date).toLocaleDateString('sv-SE', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <Card key={event.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-gray-900">{event.title}</h2>
                      <Badge variant={event.registration_open ? 'green' : 'gray'}>
                        {event.registration_open ? 'Öppen' : 'Stängd'}
                      </Badge>
                      {assignments.length > 0 && (
                        <Badge variant="blue">Lottning klar</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 capitalize">{date}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{households.length} hushåll</span>
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="text-green-600 hover:text-green-800 font-medium"
                    >
                      Hantera →
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

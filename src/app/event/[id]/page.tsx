import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEvent } from '@/lib/db';
import Badge from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default function EventPage({ params }: Props) {
  const event = getEvent(parseInt(params.id));
  if (!event) notFound();

  const date = new Date(event.date).toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block">
        ← Tillbaka
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
          <Badge variant={event.registration_open ? 'green' : 'gray'}>
            {event.registration_open ? 'Anmälan öppen' : 'Anmälan stängd'}
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-green-600 font-medium capitalize">{date}</p>
          {event.location && <p className="text-gray-600">📍 {event.location}</p>}
        </div>

        {event.description && (
          <p className="mt-6 text-gray-600 leading-relaxed">{event.description}</p>
        )}

        <div className="mt-6 bg-gray-50 rounded-lg p-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500 mb-1">Förrätt</div>
            <div className="font-semibold text-gray-800">{event.starter_time}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Varmrätt</div>
            <div className="font-semibold text-gray-800">{event.main_time}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Dessert</div>
            <div className="font-semibold text-gray-800">{event.dessert_time}</div>
          </div>
        </div>

        {event.registration_open ? (
          <Link
            href={`/event/${event.id}/register`}
            className="mt-8 block w-full text-center bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            Anmäl ert hushåll →
          </Link>
        ) : (
          <p className="mt-8 text-center text-gray-400 text-sm">
            Anmälan är stängd för detta event.
          </p>
        )}
      </div>
    </main>
  );
}

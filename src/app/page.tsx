import Link from 'next/link';
import { getOpenEvents, getHouseholds } from '@/lib/db';
import EventCard from '@/components/EventCard';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const events = getOpenEvents();

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-green-700">🚴 Cykelfesten</h1>
        <p className="text-gray-600 mt-2 text-lg">
          En progressiv middag på cykel – varje hushåll serverar en rätt hemma.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-xl">Inga öppna event just nu.</p>
          <p className="text-sm mt-2">Kom tillbaka senare!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} householdCount={getHouseholds(event.id).length} />
          ))}
        </div>
      )}
      <p className="text-center text-xs text-gray-300 mt-16">
        <Link href="/admin/login" className="hover:text-gray-400 transition-colors">
          Admin-inloggning
        </Link>
      </p>
    </main>
  );
}

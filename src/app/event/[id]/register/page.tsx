import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEvent } from '@/lib/db';
import RegistrationForm from '@/components/RegistrationForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default function RegisterPage({ params }: Props) {
  const event = getEvent(parseInt(params.id));
  if (!event || !event.registration_open) notFound();

  const date = new Date(event.date).toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <Link href={`/event/${event.id}`} className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block">
        ← Tillbaka
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Anmäl ert hushåll</h1>
        <p className="text-gray-500 text-sm mb-6">
          {event.title} – <span className="capitalize">{date}</span>
        </p>

        <RegistrationForm eventId={event.id} />
      </div>
    </main>
  );
}

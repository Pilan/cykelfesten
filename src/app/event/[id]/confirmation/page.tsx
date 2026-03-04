import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEvent } from '@/lib/db';

interface Props {
  params: { id: string };
}

export default function ConfirmationPage({ params }: Props) {
  const event = getEvent(parseInt(params.id));
  if (!event) notFound();

  const date = new Date(event.date).toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Tack för er anmälan!</h1>
      <p className="text-gray-600 mb-4">
        Ni är nu anmälda till <strong>{event.title}</strong>.
      </p>
      <p className="text-gray-500 text-sm mb-8 capitalize">{date}</p>

      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-left text-sm text-green-900 mb-8">
        <p className="font-semibold mb-2">Vad händer nu?</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>En bekräftelse har skickats till er e-post.</li>
          <li>Ni får ett SMS med info om vilken rätt ni serverar.</li>
          <li>Dagen för festen får ni adresser via SMS.</li>
        </ul>
      </div>

      <Link href="/" className="text-green-600 hover:text-green-800 font-medium">
        Tillbaka till startsidan
      </Link>
    </main>
  );
}

import Link from 'next/link';
import type { Event } from '@/lib/types';
import Badge from './ui/Badge';

interface Props {
  event: Event;
  householdCount: number;
}

export default function EventCard({ event, householdCount }: Props) {
  const date = new Date(event.date);
  const formattedDate = date.toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900">{event.title}</h2>
          <p className="text-green-600 font-medium mt-1 capitalize">{formattedDate}</p>
          {event.location && (
            <p className="text-gray-500 text-sm mt-1">📍 {event.location}</p>
          )}
          {event.description && (
            <p className="text-gray-600 mt-3 line-clamp-2 text-sm">{event.description}</p>
          )}
        </div>
        <Badge variant={event.registration_open ? 'green' : 'gray'}>
          {event.registration_open ? 'Öppen' : 'Stängd'}
        </Badge>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500 flex items-center gap-3">
          <span>🍽️ {event.starter_time} / {event.main_time} / {event.dessert_time}</span>
          <span className="text-gray-400">·</span>
          <span>🏠 {householdCount} hushåll anmälda</span>
        </div>
        {event.registration_open ? (
          <Link
            href={`/event/${event.id}/register`}
            className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Anmäl dig →
          </Link>
        ) : (
          <Link
            href={`/event/${event.id}`}
            className="text-green-600 hover:text-green-700 font-medium text-sm"
          >
            Läs mer →
          </Link>
        )}
      </div>
    </div>
  );
}

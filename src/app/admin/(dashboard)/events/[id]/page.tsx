import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEventForAdmin, getHouseholds, getAssignments } from '@/lib/db';
import { getSession } from '@/lib/auth';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import HouseholdTable from '@/components/admin/HouseholdTable';
import LotteryActions from './LotteryActions';
import SMSPanel from '@/components/admin/SMSPanel';
import DeleteEventButton from './DeleteEventButton';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default function AdminEventPage({ params }: Props) {
  const session = getSession()!;
  const id = parseInt(params.id);
  const event = getEventForAdmin(id, session.adminId);
  if (!event) notFound();

  const households = getHouseholds(id);
  const assignments = getAssignments(id);
  const hasLottery = assignments.length > 0;

  const date = new Date(event.date).toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
            <Badge variant={event.registration_open ? 'green' : 'gray'}>
              {event.registration_open ? 'Anmälan öppen' : 'Stängd'}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm capitalize">{date}</p>
          {event.location && <p className="text-gray-500 text-sm">📍 {event.location}</p>}
          <p className="text-gray-400 text-xs mt-1">
            🍽️ {event.starter_time} / {event.main_time} / {event.dessert_time}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/events/${id}/templates`}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Mallar
          </Link>
          <Link
            href={`/admin/events/${id}/edit`}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Redigera
          </Link>
          <DeleteEventButton eventId={id} />
        </div>
      </div>

      {/* Households */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">
            Anmälda hushåll ({households.length})
          </h2>
        </div>
        <HouseholdTable eventId={id} households={households} assignments={assignments} />
      </Card>

      {/* Lottery */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Lottning</h2>
          {hasLottery && (
            <Link
              href={`/admin/events/${id}/lottery`}
              className="text-sm text-green-600 hover:underline font-medium"
            >
              Visa / justera →
            </Link>
          )}
        </div>
        <LotteryActions eventId={id} householdCount={households.length} hasLottery={hasLottery} />
      </Card>

      {/* SMS */}
      {hasLottery && (
        <Card className="p-5">
          <h2 className="font-semibold text-gray-900 mb-4">SMS-utskick</h2>
          <SMSPanel eventId={id} assignments={assignments} />
        </Card>
      )}
    </div>
  );
}

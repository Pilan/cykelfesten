import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEventForAdmin, getHouseholds, getAssignments } from '@/lib/db';
import { getSession } from '@/lib/auth';
import LotteryPanel from '@/components/admin/LotteryPanel';
import { runLottery } from '@/lib/lottery';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default function LotteryPage({ params }: Props) {
  const session = getSession()!;
  const id = parseInt(params.id);
  const event = getEventForAdmin(id, session.adminId);
  if (!event) notFound();

  const households = getHouseholds(id);
  const assignments = getAssignments(id);

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">Ingen lottning genomförd än.</p>
        <Link href={`/admin/events/${id}`} className="text-green-600 hover:underline">
          ← Tillbaka till eventet
        </Link>
      </div>
    );
  }

  // Derive warnings from a fresh lottery check (non-destructive)
  const { warnings } = runLottery(households);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/admin/events/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
            ← {event.title}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Lottning</h1>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Dra hushållskort mellan kolumnerna för att ändra vilken rätt de serverar.
        Klicka på "Spara ändringar" när du är nöjd.
      </p>

      <LotteryPanel
        eventId={id}
        households={households}
        assignments={assignments}
        warnings={warnings}
      />
    </div>
  );
}

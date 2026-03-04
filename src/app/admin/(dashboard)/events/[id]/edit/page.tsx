import { notFound } from 'next/navigation';
import { getEventForAdmin } from '@/lib/db';
import { getSession } from '@/lib/auth';
import EventForm from '@/components/admin/EventForm';

interface Props {
  params: { id: string };
}

export default function EditEventPage({ params }: Props) {
  const session = getSession()!;
  const event = getEventForAdmin(parseInt(params.id), session.adminId);
  if (!event) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Redigera event</h1>
      <EventForm event={event} />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface Props {
  eventId: number;
}

export default function DeleteEventButton({ eventId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Ta bort detta event och alla anmälningar? Detta går inte att ångra.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="danger" size="sm" onClick={handleDelete} disabled={loading}>
      {loading ? '...' : 'Ta bort event'}
    </Button>
  );
}

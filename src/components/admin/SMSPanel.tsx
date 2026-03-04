'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Assignment } from '@/lib/types';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface Props {
  eventId: number;
  assignments: Assignment[];
}

type SmsType = 'advance' | 'starter' | 'main' | 'dessert';

export default function SMSPanel({ eventId, assignments }: Props) {
  const router = useRouter();
  const [sending, setSending] = useState<SmsType | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const advanceSent = assignments.every((a) => a.sms_advance_sent);
  const starterSent = assignments.every((a) => a.sms_starter_sent);
  const mainSent = assignments.every((a) => a.sms_main_sent);
  const dessertSent = assignments.every((a) => a.sms_dessert_sent);

  const send = async (type: SmsType) => {
    const labels: Record<SmsType, string> = {
      advance: 'förhandsinfo-SMS',
      starter: 'starter-SMS',
      main: 'varmrätt-SMS',
      dessert: 'dessert-SMS',
    };
    if (!confirm(`Skicka ${labels[type]} till alla ${assignments.length} hushåll?`)) return;

    setSending(type);
    setError('');
    setSuccess('');
    try {
      const url =
        type === 'advance'
          ? `/api/admin/events/${eventId}/sms/advance`
          : `/api/admin/events/${eventId}/sms/course`;
      const body = type === 'advance' ? {} : { course: type };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Misslyckades.');
        return;
      }
      setSuccess(`${labels[type]} skickade!`);
      router.refresh();
    } catch {
      setError('Nätverksfel.');
    } finally {
      setSending(null);
    }
  };

  if (assignments.length === 0) {
    return (
      <p className="text-gray-400 text-sm">
        Kör lottning först för att kunna skicka SMS.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="grid gap-3">
        <SmsRow
          label="Förhandsinfo (2 dagar innan)"
          description="Berättar vilken rätt de serverar och tid."
          sent={advanceSent}
          loading={sending === 'advance'}
          onSend={() => send('advance')}
        />
        <SmsRow
          label="Dag-av: Förrätt"
          description="Skickas 30 min innan – värd eller besökare."
          sent={starterSent}
          loading={sending === 'starter'}
          onSend={() => send('starter')}
        />
        <SmsRow
          label="Dag-av: Varmrätt"
          description="Skickas 30 min innan – värd eller besökare."
          sent={mainSent}
          loading={sending === 'main'}
          onSend={() => send('main')}
        />
        <SmsRow
          label="Dag-av: Dessert"
          description="Skickas 30 min innan – värd eller besökare."
          sent={dessertSent}
          loading={sending === 'dessert'}
          onSend={() => send('dessert')}
        />
      </div>
    </div>
  );
}

function SmsRow({
  label,
  description,
  sent,
  loading,
  onSend,
}: {
  label: string;
  description: string;
  sent: boolean;
  loading: boolean;
  onSend: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
      <div>
        <div className="text-sm font-medium text-gray-800">{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      {sent ? (
        <span className="text-xs text-green-600 font-medium whitespace-nowrap">✓ Skickat</span>
      ) : (
        <Button size="sm" variant="secondary" onClick={onSend} disabled={loading}>
          {loading ? 'Skickar...' : 'Skicka'}
        </Button>
      )}
    </div>
  );
}

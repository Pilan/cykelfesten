'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface Props {
  eventId: number;
  householdCount: number;
  hasLottery: boolean;
}

export default function LotteryActions({ eventId, householdCount, hasLottery }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<'run' | 'clear' | null>(null);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  const runLottery = async () => {
    if (householdCount < 3) {
      setError('Behöver minst 3 hushåll för att köra lottning.');
      return;
    }
    setLoading('run');
    setError('');
    setWarnings([]);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/lottery`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Misslyckades.');
        return;
      }
      if (data.warnings?.length) setWarnings(data.warnings);
      router.refresh();
    } catch {
      setError('Nätverksfel.');
    } finally {
      setLoading(null);
    }
  };

  const clearLottery = async () => {
    if (!confirm('Ta bort lottningsresultatet?')) return;
    setLoading('clear');
    setError('');
    try {
      const res = await fetch(`/api/admin/events/${eventId}/lottery`, { method: 'DELETE' });
      if (!res.ok) {
        setError('Misslyckades.');
        return;
      }
      router.refresh();
    } catch {
      setError('Nätverksfel.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {error && <Alert variant="error">{error}</Alert>}
      {warnings.length > 0 && (
        <Alert variant="warning">
          <p className="font-medium mb-1">Varningar</p>
          <ul className="list-disc list-inside">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </Alert>
      )}

      {hasLottery ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-green-600 font-medium">✓ Lottning genomförd</span>
          <Button variant="secondary" size="sm" onClick={runLottery} disabled={loading !== null}>
            {loading === 'run' ? 'Kör...' : 'Kör om'}
          </Button>
          <Button variant="danger" size="sm" onClick={clearLottery} disabled={loading !== null}>
            {loading === 'clear' ? 'Rensar...' : 'Rensa'}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Button onClick={runLottery} disabled={loading !== null || householdCount < 3}>
            {loading === 'run' ? 'Kör lottning...' : 'Kör lottning'}
          </Button>
          {householdCount < 3 && (
            <span className="text-sm text-gray-400">
              Behöver minst 3 hushåll ({householdCount} anmälda)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import type { Event } from '@/lib/types';

interface Props {
  event?: Partial<Event>;
  onSubmit?: (data: FormData) => Promise<void>;
}

type FormData = {
  title: string;
  date: string;
  description: string;
  location: string;
  max_participants: number;
  registration_open: boolean;
  starter_time: string;
  main_time: string;
  dessert_time: string;
};

export default function EventForm({ event }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    title: event?.title ?? '',
    date: event?.date ?? '',
    description: event?.description ?? '',
    location: event?.location ?? '',
    max_participants: event?.max_participants ?? 50,
    registration_open: (event?.registration_open ?? 1) === 1,
    starter_time: event?.starter_time ?? '17:00',
    main_time: event?.main_time ?? '19:00',
    dessert_time: event?.dessert_time ?? '21:00',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!event?.id;
  const url = isEdit ? `/api/admin/events/${event.id}` : '/api/admin/events';
  const method = isEdit ? 'PUT' : 'POST';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          registration_open: form.registration_open ? 1 : 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Kunde inte spara.');
        return;
      }
      const saved = await res.json();
      router.push(`/admin/events/${saved.id ?? event?.id}`);
      router.refresh();
    } catch {
      setError('Nätverksfel.');
    } finally {
      setLoading(false);
    }
  };

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-xl">
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Titel *"
        value={form.title}
        onChange={(e) => set('title', e.target.value)}
        placeholder="Cykelfesten 2026"
        required
      />
      <Input
        label="Datum *"
        type="date"
        value={form.date}
        onChange={(e) => set('date', e.target.value)}
        required
      />
      <Input
        label="Plats"
        value={form.location}
        onChange={(e) => set('location', e.target.value)}
        placeholder="Exempelstad"
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Beskrivning</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>

      <Input
        label="Max antal hushåll"
        type="number"
        min={3}
        value={form.max_participants}
        onChange={(e) => set('max_participants', parseInt(e.target.value) || 50)}
      />

      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Tid förrätt"
          type="time"
          value={form.starter_time}
          onChange={(e) => set('starter_time', e.target.value)}
        />
        <Input
          label="Tid varmrätt"
          type="time"
          value={form.main_time}
          onChange={(e) => set('main_time', e.target.value)}
        />
        <Input
          label="Tid dessert"
          type="time"
          value={form.dessert_time}
          onChange={(e) => set('dessert_time', e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.registration_open}
          onChange={(e) => set('registration_open', e.target.checked)}
          className="w-4 h-4 accent-green-600"
        />
        <span className="text-sm font-medium text-gray-700">Anmälan öppen</span>
      </label>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Sparar...' : isEdit ? 'Spara ändringar' : 'Skapa event'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}

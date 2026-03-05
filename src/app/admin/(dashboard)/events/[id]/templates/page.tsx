'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';

const FIELDS = [
  {
    key: 'email_subject',
    label: 'Bekräftelsemail – ämnesrad',
    rows: 1,
    vars: ['{{event_titel}}'],
  },
  {
    key: 'email_body',
    label: 'Bekräftelsemail – brödtext',
    rows: 8,
    vars: ['{{event_titel}}', '{{datum}}', '{{plats}}', '{{namn}}', '{{adress}}', '{{platser}}', '{{specialkost}}'],
  },
  {
    key: 'sms_advance',
    label: 'SMS – förhandsinfo till värdar',
    rows: 3,
    vars: ['{{datum}}', '{{rätt}}', '{{tid}}', '{{antal_gäster}}', '{{specialkost}}'],
  },
  {
    key: 'sms_host',
    label: 'SMS – dag-SMS till värdar',
    rows: 2,
    vars: ['{{rätt}}', '{{tid}}'],
  },
  {
    key: 'sms_guest',
    label: 'SMS – dag-SMS till gäster',
    rows: 2,
    vars: ['{{rätt}}', '{{tid}}', '{{adress}}'],
  },
];

export default function TemplatesPage() {
  const { id } = useParams<{ id: string }>();
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/events/${id}/templates`)
      .then((r) => r.json())
      .then((data) => { setTemplates(data); setLoading(false); });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/events/${id}/templates`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templates),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-400 text-sm">Laddar...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/admin/events/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
            ← Tillbaka till eventet
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Redigera mallar</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Sparar...' : saved ? 'Sparat ✓' : 'Spara'}
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Använd <code className="bg-gray-100 px-1 rounded">{'{{variabel}}'}</code> för dynamiska värden.
        Ändringar gäller för detta event.
      </p>

      {FIELDS.map((field) => (
        <Card key={field.key} className="p-5">
          <label className="block font-medium text-gray-900 mb-1">{field.label}</label>
          <p className="text-xs text-gray-400 mb-2">
            Tillgängliga variabler: {field.vars.join(', ')}
          </p>
          <textarea
            rows={field.rows}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
            value={templates[field.key] ?? ''}
            onChange={(e) => setTemplates({ ...templates, [field.key]: e.target.value })}
          />
        </Card>
      ))}
    </div>
  );
}

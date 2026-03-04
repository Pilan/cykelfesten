'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MembersInput from './MembersInput';
import Button from './ui/Button';
import Input from './ui/Input';
import Alert from './ui/Alert';

interface Props {
  eventId: number;
}

export default function RegistrationForm({ eventId }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState<string[]>(['']);
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [capacity, setCapacity] = useState(2);
  const [dietary, setDietary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const filledMembers = members.filter((m) => m.trim());
    if (filledMembers.length === 0) {
      setError('Ange minst ett namn.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          members: filledMembers,
          address,
          email,
          phone,
          capacity,
          dietary,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Något gick fel. Försök igen.');
        return;
      }

      router.push(`/event/${eventId}/confirmation`);
    } catch {
      setError('Nätverksfel. Kontrollera din uppkoppling.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && <Alert variant="error">{error}</Alert>}

      <MembersInput members={members} onChange={setMembers} />

      <Input
        label="Adress (gata och nummer)"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Exempelgatan 12"
        required
      />

      <Input
        label="E-post"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="exempel@mail.se"
        required
      />

      <Input
        label="Telefon (för SMS)"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+46701234567"
        required
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="capacity" className="text-sm font-medium text-gray-700">
          Extra platser ni kan ta emot (utöver er själva)
        </label>
        <input
          id="capacity"
          type="number"
          min={1}
          max={20}
          value={capacity}
          onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
          className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
        <p className="text-xs text-gray-500">Hur många gäster kan ni ta emot per rätt?</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="dietary" className="text-sm font-medium text-gray-700">
          Specialkost / allergier (valfritt)
        </label>
        <textarea
          id="dietary"
          value={dietary}
          onChange={(e) => setDietary(e.target.value)}
          placeholder="Vegetarian, glutenintolerant, nötallergi..."
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? 'Anmäler...' : 'Skicka anmälan'}
      </Button>
    </form>
  );
}

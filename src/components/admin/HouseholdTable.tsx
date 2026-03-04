'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Household, Assignment } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface Props {
  eventId: number;
  households: Household[];
  assignments: Assignment[];
}

const courseLabel = { starter: 'Förrätt', main: 'Varmrätt', dessert: 'Dessert' };

export default function HouseholdTable({ eventId, households, assignments }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<number | null>(null);

  const assignmentMap = new Map(assignments.map((a) => [a.household_id, a]));

  const handleDelete = async (id: number) => {
    if (!confirm('Ta bort denna anmälan?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/households/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(null);
    }
  };

  if (households.length === 0) {
    return (
      <p className="text-gray-400 text-sm py-4 text-center">
        Inga anmälda hushåll ännu.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-2 pr-4 font-medium">Namn</th>
            <th className="pb-2 pr-4 font-medium">Adress</th>
            <th className="pb-2 pr-4 font-medium">Kontakt</th>
            <th className="pb-2 pr-4 font-medium">Platser</th>
            <th className="pb-2 pr-4 font-medium">Rätt</th>
            <th className="pb-2 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {households.map((h) => {
            const members: string[] = JSON.parse(h.members);
            const assignment = assignmentMap.get(h.id);
            return (
              <tr key={h.id} className="hover:bg-gray-50">
                <td className="py-2 pr-4">
                  <div className="font-medium">{members.join(', ')}</div>
                  {h.dietary && (
                    <div className="text-xs text-gray-400">{h.dietary}</div>
                  )}
                </td>
                <td className="py-2 pr-4 text-gray-600">{h.address}</td>
                <td className="py-2 pr-4">
                  <div className="text-gray-600">{h.email}</div>
                  <div className="text-gray-400 text-xs">{h.phone}</div>
                </td>
                <td className="py-2 pr-4 text-center">{h.capacity}</td>
                <td className="py-2 pr-4">
                  {assignment ? (
                    <Badge variant="blue">{courseLabel[assignment.course]}</Badge>
                  ) : (
                    <span className="text-gray-300">–</span>
                  )}
                </td>
                <td className="py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(h.id)}
                    disabled={deleting === h.id}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    {deleting === h.id ? '...' : 'Ta bort'}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

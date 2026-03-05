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

interface EditState {
  members: string; // comma-separated
  address: string;
  email: string;
  phone: string;
  capacity: number;
  dietary: string;
}

export default function HouseholdTable({ eventId, households, assignments }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);

  const assignmentMap = new Map(assignments.map((a) => [a.household_id, a]));

  const startEdit = (h: Household) => {
    const members: string[] = JSON.parse(h.members);
    setEditState({
      members: members.join(', '),
      address: h.address,
      email: h.email,
      phone: h.phone,
      capacity: h.capacity,
      dietary: h.dietary,
    });
    setEditing(h.id);
  };

  const handleSave = async (id: number) => {
    if (!editState) return;
    setSaving(true);
    try {
      const members = editState.members.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await fetch(`/api/admin/events/${eventId}/households/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editState, members: JSON.stringify(members) }),
      });
      if (res.ok) {
        setEditing(null);
        setEditState(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

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
            const isEditing = editing === h.id;

            if (isEditing && editState) {
              return (
                <tr key={h.id} className="bg-green-50">
                  <td colSpan={6} className="py-3 px-2">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="text-xs text-gray-500 block mb-0.5">Namn (kommaseparerat)</label>
                        <input
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          value={editState.members}
                          onChange={(e) => setEditState({ ...editState, members: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-0.5">Adress</label>
                        <input
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          value={editState.address}
                          onChange={(e) => setEditState({ ...editState, address: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-0.5">E-post</label>
                        <input
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          value={editState.email}
                          onChange={(e) => setEditState({ ...editState, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-0.5">Telefon</label>
                        <input
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          value={editState.phone}
                          onChange={(e) => setEditState({ ...editState, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-0.5">Extra platser</label>
                        <input
                          type="number"
                          min={0}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          value={editState.capacity}
                          onChange={(e) => setEditState({ ...editState, capacity: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-0.5">Specialkost</label>
                        <input
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          value={editState.dietary}
                          onChange={(e) => setEditState({ ...editState, dietary: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSave(h.id)} disabled={saving}>
                        {saving ? 'Sparar...' : 'Spara'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setEditState(null); }}>
                        Avbryt
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            }

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
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(h)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Redigera
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(h.id)}
                      disabled={deleting === h.id}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      {deleting === h.id ? '...' : 'Ta bort'}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

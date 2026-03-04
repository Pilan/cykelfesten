'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Household, Assignment } from '@/lib/types';
import type { AssignmentDraft } from '@/lib/types';
import { recalculateVisits } from '@/lib/lottery';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import CapacityWarning from './CapacityWarning';

interface Props {
  eventId: number;
  households: Household[];
  assignments: Assignment[];
  warnings: string[];
}

type Course = 'starter' | 'main' | 'dessert';
const COURSES: Course[] = ['starter', 'main', 'dessert'];
const COURSE_LABEL: Record<Course, string> = {
  starter: 'Förrätt',
  main: 'Varmrätt',
  dessert: 'Dessert',
};

function toServing(assignments: Assignment[]): Map<number, Course> {
  return new Map(assignments.map((a) => [a.household_id, a.course]));
}

function toDraftMap(drafts: AssignmentDraft[]): Map<number, AssignmentDraft> {
  return new Map(drafts.map((d) => [d.householdId, d]));
}

function fromAssignments(assignments: Assignment[]): AssignmentDraft[] {
  return assignments.map((a) => ({
    householdId: a.household_id,
    course: a.course,
    visitsStarter: a.visits_starter,
    visitsMain: a.visits_main,
    visitsDessert: a.visits_dessert,
  }));
}

export default function LotteryPanel({ eventId, households, assignments, warnings }: Props) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<AssignmentDraft[]>(() => fromAssignments(assignments));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dragId, setDragId] = useState<number | null>(null);

  const householdMap = new Map(households.map((h) => [h.id, h]));
  const draftMap = toDraftMap(drafts);

  const handleDrop = (targetCourse: Course) => {
    if (dragId === null) return;
    const current = draftMap.get(dragId);
    if (!current || current.course === targetCourse) return;

    const serving = new Map(drafts.map((d) => [d.householdId, d.course]));
    serving.set(dragId, targetCourse);
    const recalculated = recalculateVisits(households, serving);
    setDrafts(recalculated);
    setDirty(true);
    setDragId(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/events/${eventId}/lottery`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments: drafts }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Kunde inte spara.');
        return;
      }
      setDirty(false);
      router.refresh();
    } catch {
      setError('Nätverksfel.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDrafts(fromAssignments(assignments));
    setDirty(false);
  };

  const getVisitAddress = (hostId: number | null) => {
    if (hostId === null) return null;
    const h = householdMap.get(hostId);
    return h ? h.address : '?';
  };

  return (
    <div className="flex flex-col gap-4">
      <CapacityWarning warnings={warnings} />
      {error && <Alert variant="error">{error}</Alert>}

      {dirty && (
        <Alert variant="warning">
          Du har osparade ändringar.
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-4">
        {COURSES.map((course) => {
          const hosts = drafts.filter((d) => d.course === course);
          return (
            <div
              key={course}
              className="flex flex-col gap-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(course)}
            >
              <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 text-center">
                {COURSE_LABEL[course]}
                <span className="ml-2 text-xs font-normal text-gray-400">
                  ({hosts.length} värd{hosts.length !== 1 ? 'ar' : ''})
                </span>
              </div>

              {hosts.map((draft) => {
                const h = householdMap.get(draft.householdId);
                if (!h) return null;
                const members: string[] = JSON.parse(h.members);

                const visitsStarter =
                  draft.course === 'starter' ? 'Hemma' : getVisitAddress(draft.visitsStarter);
                const visitsMain =
                  draft.course === 'main' ? 'Hemma' : getVisitAddress(draft.visitsMain);
                const visitsDessert =
                  draft.course === 'dessert' ? 'Hemma' : getVisitAddress(draft.visitsDessert);

                // Count visitor PEOPLE (not households) coming to this host
                const visitorPeople = drafts
                  .filter((d) => {
                    if (course === 'starter') return d.visitsStarter === draft.householdId;
                    if (course === 'main') return d.visitsMain === draft.householdId;
                    return d.visitsDessert === draft.householdId;
                  })
                  .reduce((sum, d) => {
                    const vh = householdMap.get(d.householdId);
                    if (!vh) return sum;
                    return sum + (JSON.parse(vh.members) as string[]).length;
                  }, 0);
                const overCapacity = visitorPeople > h.capacity;

                return (
                  <div
                    key={draft.householdId}
                    draggable
                    onDragStart={() => setDragId(draft.householdId)}
                    onDragEnd={() => setDragId(null)}
                    className={`border rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm select-none transition-opacity ${
                      dragId === draft.householdId ? 'opacity-50' : ''
                    } ${overCapacity ? 'bg-red-50 border-red-400' : 'bg-white'}`}
                  >
                    <div className="font-medium text-sm text-gray-900">{members.join(', ')}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{h.address}</div>
                    <div className={`text-xs mt-1 font-medium ${overCapacity ? 'text-red-600' : 'text-blue-600'}`}>
                      Tar emot {visitorPeople} gästpersoner
                      {overCapacity && ` (max ${h.capacity})`}
                    </div>
                    <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                      <div>🍽️ Förrätt: <span className={visitsStarter === 'Hemma' ? 'text-green-600 font-medium' : ''}>{visitsStarter ?? '–'}</span></div>
                      <div>🥘 Varmrätt: <span className={visitsMain === 'Hemma' ? 'text-green-600 font-medium' : ''}>{visitsMain ?? '–'}</span></div>
                      <div>🍰 Dessert: <span className={visitsDessert === 'Hemma' ? 'text-green-600 font-medium' : ''}>{visitsDessert ?? '–'}</span></div>
                    </div>
                  </div>
                );
              })}

              {hosts.length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-xs text-gray-400">
                  Dra ett hushåll hit
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving || !dirty}>
          {saving ? 'Sparar...' : 'Spara ändringar'}
        </Button>
        {dirty && (
          <Button variant="secondary" onClick={handleReset}>
            Ångra
          </Button>
        )}
      </div>
    </div>
  );
}

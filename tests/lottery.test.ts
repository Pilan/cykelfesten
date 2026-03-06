import { describe, it, expect } from 'vitest';
import { runLottery, recalculateVisits } from '@/lib/lottery';
import type { Household } from '@/lib/types';

function makeHousehold(id: number, capacity = 4): Household {
  return {
    id,
    event_id: 1,
    members: '["Person"]',
    address: `Gata ${id}`,
    email: `h${id}@test.se`,
    phone: '0701234567',
    capacity,
    dietary: '',
    created_at: new Date().toISOString(),
  };
}

describe('runLottery', () => {
  it('returns a warning and no assignments for fewer than 3 households', () => {
    const result = runLottery([makeHousehold(1), makeHousehold(2)]);
    expect(result.assignments).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('produces exactly one assignment per household', () => {
    const households = [1, 2, 3, 4, 5, 6].map((id) => makeHousehold(id));
    const { assignments } = runLottery(households);
    expect(assignments).toHaveLength(households.length);
    const ids = assignments.map((a) => a.householdId).sort();
    expect(ids).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('every household is assigned exactly one hosting course', () => {
    const households = [1, 2, 3, 4, 5, 6].map((id) => makeHousehold(id));
    const { assignments } = runLottery(households);
    const courses = assignments.map((a) => a.course);
    expect(courses.every((c) => ['starter', 'main', 'dessert'].includes(c))).toBe(true);
  });

  it('hosts have null for the course they host', () => {
    const households = [1, 2, 3].map((id) => makeHousehold(id));
    const { assignments } = runLottery(households);
    for (const a of assignments) {
      if (a.course === 'starter') expect(a.visitsStarter).toBeNull();
      if (a.course === 'main') expect(a.visitsMain).toBeNull();
      if (a.course === 'dessert') expect(a.visitsDessert).toBeNull();
    }
  });

  it('visitors for each course point to a valid host household', () => {
    const households = [1, 2, 3, 4, 5, 6].map((id) => makeHousehold(id));
    const { assignments } = runLottery(households);
    const allIds = new Set(households.map((h) => h.id));

    const starterHosts = new Set(
      assignments.filter((a) => a.course === 'starter').map((a) => a.householdId)
    );
    const mainHosts = new Set(
      assignments.filter((a) => a.course === 'main').map((a) => a.householdId)
    );
    const dessertHosts = new Set(
      assignments.filter((a) => a.course === 'dessert').map((a) => a.householdId)
    );

    for (const a of assignments) {
      if (a.visitsStarter !== null) {
        expect(allIds.has(a.visitsStarter)).toBe(true);
        expect(starterHosts.has(a.visitsStarter)).toBe(true);
      }
      if (a.visitsMain !== null) {
        expect(allIds.has(a.visitsMain)).toBe(true);
        expect(mainHosts.has(a.visitsMain)).toBe(true);
      }
      if (a.visitsDessert !== null) {
        expect(allIds.has(a.visitsDessert)).toBe(true);
        expect(dessertHosts.has(a.visitsDessert)).toBe(true);
      }
    }
  });

  it('produces no warnings for a well-balanced group of 6', () => {
    const households = [1, 2, 3, 4, 5, 6].map((id) => makeHousehold(id));
    const { warnings } = runLottery(households);
    expect(warnings).toHaveLength(0);
  });

  it('handles 3 households (minimum)', () => {
    const households = [1, 2, 3].map((id) => makeHousehold(id));
    const { assignments, warnings } = runLottery(households);
    expect(assignments).toHaveLength(3);
    expect(warnings).toHaveLength(0);
  });
});

describe('recalculateVisits', () => {
  it('returns one assignment per household', () => {
    const households = [1, 2, 3, 4, 5, 6].map((id) => makeHousehold(id));
    const serving = new Map<number, 'starter' | 'main' | 'dessert'>([
      [1, 'starter'], [2, 'starter'],
      [3, 'main'],    [4, 'main'],
      [5, 'dessert'], [6, 'dessert'],
    ]);
    const result = recalculateVisits(households, serving);
    expect(result).toHaveLength(6);
  });

  it('hosts have null for their own course', () => {
    const households = [1, 2, 3, 4, 5, 6].map((id) => makeHousehold(id));
    const serving = new Map<number, 'starter' | 'main' | 'dessert'>([
      [1, 'starter'], [2, 'starter'],
      [3, 'main'],    [4, 'main'],
      [5, 'dessert'], [6, 'dessert'],
    ]);
    const result = recalculateVisits(households, serving);
    for (const a of result) {
      if (a.course === 'starter') expect(a.visitsStarter).toBeNull();
      if (a.course === 'main') expect(a.visitsMain).toBeNull();
      if (a.course === 'dessert') expect(a.visitsDessert).toBeNull();
    }
  });
});

import type { Household, AssignmentDraft, LotteryResult } from './types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Maps householdId → Set of householdIds they've already shared a table with
type MetMap = Map<number, Set<number>>;

// After assigning a course, record all pairwise meetings (including host ↔ visitors)
function recordMeetings(
  assignmentMap: Map<number, number>, // visitor_id → host_id
  hostIds: number[],
  met: MetMap
): void {
  const groups = new Map<number, number[]>();
  hostIds.forEach((hid) => groups.set(hid, []));
  Array.from(assignmentMap.entries()).forEach(([visitorId, hostId]) => {
    groups.get(hostId)?.push(visitorId);
  });

  Array.from(groups.entries()).forEach(([hostId, visitors]) => {
    const everyone = [hostId, ...visitors];
    everyone.forEach((a) => {
      everyone.forEach((b) => {
        if (a !== b) {
          if (!met.has(a)) met.set(a, new Set());
          met.get(a)!.add(b);
        }
      });
    });
  });
}

function greedyAssign(
  hosts: Array<{ id: number; capacity: number }>,
  visitors: Array<{ id: number }>,
  met: MetMap = new Map()
): Map<number, number> {
  if (hosts.length === 0) return new Map();

  const remaining = new Map(hosts.map((h) => [h.id, h.capacity]));
  const load = new Map(hosts.map((h) => [h.id, 0]));
  // Track who's been assigned to each host so far (they'll also meet each other)
  const currentlyAt = new Map<number, number[]>();
  hosts.forEach((h) => currentlyAt.set(h.id, []));
  const result = new Map<number, number>();

  for (const visitor of visitors) {
    const alreadyMet = met.get(visitor.id) ?? new Set<number>();

    const score = (hid: number, cap: number): number => {
      const currentLoad = load.get(hid) ?? 0;
      const atHost = currentlyAt.get(hid) ?? [];
      // Penalize if visitor has already met people at this host (from previous courses)
      const overlap = atHost.filter((vid) => alreadyMet.has(vid)).length +
                      (alreadyMet.has(hid) ? 1 : 0);
      return -overlap * 1_000_000 - currentLoad * 10_000 + cap;
    };

    // Try hosts with remaining capacity first
    let bestId: number | null = null;
    let bestScore = -Infinity;
    Array.from(remaining.entries()).forEach(([hid, cap]) => {
      if (cap > 0) {
        const s = score(hid, cap);
        if (s > bestScore) { bestScore = s; bestId = hid; }
      }
    });

    // Fallback: all hosts full – pick best regardless of capacity
    if (bestId === null) {
      Array.from(load.keys()).forEach((hid) => {
        const s = score(hid, 0);
        if (s > bestScore) { bestScore = s; bestId = hid; }
      });
    }

    if (bestId !== null) {
      result.set(visitor.id, bestId);
      remaining.set(bestId, remaining.get(bestId)! - 1);
      load.set(bestId, load.get(bestId)! + 1);
      currentlyAt.get(bestId)!.push(visitor.id);
    }
  }
  return result;
}

export function runLottery(households: Household[]): LotteryResult {
  const warnings: string[] = [];

  if (households.length < 3) {
    warnings.push('Behöver minst 3 hushåll för att köra lottning.');
    return { assignments: [], warnings };
  }

  const shuffled = shuffle(households);
  const n = shuffled.length;
  const base = Math.floor(n / 3);
  const extra = n % 3;

  // Give extras to starter then main (not dessert) so dessert stays smallest.
  const s1 = base + (extra > 0 ? 1 : 0);
  const s2 = s1 + base + (extra > 1 ? 1 : 0);

  const starterHosts = shuffled.slice(0, s1);
  const mainHosts = shuffled.slice(s1, s2);
  const dessertHosts = shuffled.slice(s2);

  const starterVisitors = [...mainHosts, ...dessertHosts];
  const mainVisitors = [...starterHosts, ...dessertHosts];
  const dessertVisitors = [...starterHosts, ...mainHosts];

  const check = (hosts: Household[], visitors: Household[], name: string) => {
    const cap = hosts.reduce((s, h) => s + h.capacity, 0);
    if (cap < visitors.length) {
      warnings.push(
        `Kapacitetsbrist för ${name}: ${cap} platser men ${visitors.length} besökare.`
      );
    }
  };
  check(starterHosts, starterVisitors, 'förrätt');
  check(mainHosts, mainVisitors, 'varmrätt');
  check(dessertHosts, dessertVisitors, 'dessert');

  // Assign starter, then use meeting history to diversify main and dessert
  const met: MetMap = new Map();

  const starterMap = greedyAssign(starterHosts, starterVisitors, met);
  recordMeetings(starterMap, starterHosts.map((h) => h.id), met);

  const mainMap = greedyAssign(mainHosts, mainVisitors, met);
  recordMeetings(mainMap, mainHosts.map((h) => h.id), met);

  const dessertMap = greedyAssign(dessertHosts, dessertVisitors, met);

  const assignments: AssignmentDraft[] = households.map((h) => {
    let course: 'starter' | 'main' | 'dessert';
    if (starterHosts.some((s) => s.id === h.id)) course = 'starter';
    else if (mainHosts.some((m) => m.id === h.id)) course = 'main';
    else course = 'dessert';

    return {
      householdId: h.id,
      course,
      visitsStarter: course === 'starter' ? null : (starterMap.get(h.id) ?? null),
      visitsMain: course === 'main' ? null : (mainMap.get(h.id) ?? null),
      visitsDessert: course === 'dessert' ? null : (dessertMap.get(h.id) ?? null),
    };
  });

  for (const a of assignments) {
    if (a.visitsStarter === undefined) warnings.push(`Hushåll ${a.householdId} fick ingen plats för förrätt.`);
    if (a.visitsMain === undefined) warnings.push(`Hushåll ${a.householdId} fick ingen plats för varmrätt.`);
    if (a.visitsDessert === undefined) warnings.push(`Hushåll ${a.householdId} fick ingen plats för dessert.`);
  }

  return { assignments, warnings };
}

export function recalculateVisits(
  households: Household[],
  serving: Map<number, 'starter' | 'main' | 'dessert'>
): AssignmentDraft[] {
  const starterHosts = households.filter((h) => serving.get(h.id) === 'starter');
  const mainHosts = households.filter((h) => serving.get(h.id) === 'main');
  const dessertHosts = households.filter((h) => serving.get(h.id) === 'dessert');

  const met: MetMap = new Map();

  const starterMap = greedyAssign(starterHosts, [...mainHosts, ...dessertHosts], met);
  recordMeetings(starterMap, starterHosts.map((h) => h.id), met);

  const mainMap = greedyAssign(mainHosts, [...starterHosts, ...dessertHosts], met);
  recordMeetings(mainMap, mainHosts.map((h) => h.id), met);

  const dessertMap = greedyAssign(dessertHosts, [...starterHosts, ...mainHosts], met);

  return households.map((h) => {
    const course = serving.get(h.id) ?? 'starter';
    return {
      householdId: h.id,
      course,
      visitsStarter: course === 'starter' ? null : (starterMap.get(h.id) ?? null),
      visitsMain: course === 'main' ? null : (mainMap.get(h.id) ?? null),
      visitsDessert: course === 'dessert' ? null : (dessertMap.get(h.id) ?? null),
    };
  });
}

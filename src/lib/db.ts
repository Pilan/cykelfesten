import Database from 'better-sqlite3';
import path from 'path';
import type { Admin, Event, Household, Assignment } from './types';

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'cykelfesten.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
    migrateSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL DEFAULT '',
      email_verified INTEGER DEFAULT 0,
      verification_token TEXT,
      token_expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER REFERENCES admins(id),
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT DEFAULT '',
      location TEXT DEFAULT '',
      max_participants INTEGER DEFAULT 50,
      registration_open INTEGER DEFAULT 1,
      starter_time TEXT DEFAULT '17:00',
      main_time TEXT DEFAULT '19:00',
      dessert_time TEXT DEFAULT '21:00',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS households (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      members TEXT NOT NULL,
      address TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 2,
      dietary TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      course TEXT NOT NULL CHECK (course IN ('starter','main','dessert')),
      visits_starter INTEGER REFERENCES households(id),
      visits_main INTEGER REFERENCES households(id),
      visits_dessert INTEGER REFERENCES households(id),
      sms_advance_sent INTEGER DEFAULT 0,
      sms_starter_sent INTEGER DEFAULT 0,
      sms_main_sent INTEGER DEFAULT 0,
      sms_dessert_sent INTEGER DEFAULT 0,
      UNIQUE(event_id, household_id)
    );
  `);
}

// Run ALTER TABLE for existing databases missing new columns
function migrateSchema(database: Database.Database): void {
  const migrations = [
    'ALTER TABLE admins ADD COLUMN email TEXT',
    'ALTER TABLE admins ADD COLUMN email_verified INTEGER DEFAULT 0',
    'ALTER TABLE admins ADD COLUMN verification_token TEXT',
    'ALTER TABLE admins ADD COLUMN token_expires_at TEXT',
    'ALTER TABLE events ADD COLUMN admin_id INTEGER REFERENCES admins(id)',
  ];
  for (const sql of migrations) {
    try {
      database.prepare(sql).run();
    } catch {
      // Column already exists – ignore
    }
  }
}

// ── Admin ────────────────────────────────────────────────────────────────────

export function getAdmin(email: string): Admin | undefined {
  return getDb().prepare('SELECT * FROM admins WHERE email = ?').get(email) as Admin | undefined;
}

export function getAdminById(id: number): Admin | undefined {
  return getDb().prepare('SELECT * FROM admins WHERE id = ?').get(id) as Admin | undefined;
}

export function getAdminByToken(token: string): Admin | undefined {
  return getDb().prepare('SELECT * FROM admins WHERE verification_token = ?').get(token) as Admin | undefined;
}

export function createPendingAdmin(email: string, token: string, expires: string): void {
  const database = getDb();
  const existing = database.prepare('SELECT id FROM admins WHERE email = ?').get(email);
  if (existing) {
    database
      .prepare(
        'UPDATE admins SET verification_token = ?, token_expires_at = ?, email_verified = 0 WHERE email = ?'
      )
      .run(token, expires, email);
  } else {
    database
      .prepare(
        'INSERT INTO admins (email, password_hash, email_verified, verification_token, token_expires_at) VALUES (?, ?, 0, ?, ?)'
      )
      .run(email, '', token, expires);
  }
}

export function activateAdmin(token: string, passwordHash: string): void {
  getDb()
    .prepare(
      'UPDATE admins SET password_hash = ?, email_verified = 1, verification_token = NULL, token_expires_at = NULL WHERE verification_token = ?'
    )
    .run(passwordHash, token);
}

// ── Events ───────────────────────────────────────────────────────────────────

export function getOpenEvents(): Event[] {
  return getDb()
    .prepare('SELECT * FROM events WHERE registration_open = 1 ORDER BY date')
    .all() as Event[];
}

export function getAllEvents(adminId: number): Event[] {
  return getDb()
    .prepare('SELECT * FROM events WHERE admin_id = ? ORDER BY date DESC')
    .all(adminId) as Event[];
}

export function getEvent(id: number): Event | undefined {
  return getDb().prepare('SELECT * FROM events WHERE id = ?').get(id) as Event | undefined;
}

export function getEventForAdmin(id: number, adminId: number): Event | undefined {
  return getDb()
    .prepare('SELECT * FROM events WHERE id = ? AND admin_id = ?')
    .get(id, adminId) as Event | undefined;
}

export function createEvent(data: Omit<Event, 'id' | 'created_at'>): Event {
  const database = getDb();
  const res = database
    .prepare(
      `INSERT INTO events (admin_id, title, date, description, location, max_participants, registration_open, starter_time, main_time, dessert_time)
       VALUES (@admin_id, @title, @date, @description, @location, @max_participants, @registration_open, @starter_time, @main_time, @dessert_time)`
    )
    .run(data);
  return getEvent(res.lastInsertRowid as number)!;
}

export function updateEvent(id: number, data: Partial<Omit<Event, 'id' | 'created_at'>>): Event {
  const current = getEvent(id);
  if (!current) throw new Error('Event not found');
  const merged = { ...current, ...data, id };
  getDb()
    .prepare(
      `UPDATE events SET title=@title, date=@date, description=@description, location=@location,
       max_participants=@max_participants, registration_open=@registration_open,
       starter_time=@starter_time, main_time=@main_time, dessert_time=@dessert_time
       WHERE id=@id`
    )
    .run(merged);
  return getEvent(id)!;
}

export function deleteEvent(id: number): void {
  getDb().prepare('DELETE FROM events WHERE id = ?').run(id);
}

// ── Households ───────────────────────────────────────────────────────────────

export function getHouseholds(eventId: number): Household[] {
  return getDb()
    .prepare('SELECT * FROM households WHERE event_id = ? ORDER BY created_at')
    .all(eventId) as Household[];
}

export function getHousehold(id: number): Household | undefined {
  return getDb().prepare('SELECT * FROM households WHERE id = ?').get(id) as Household | undefined;
}

export function createHousehold(data: Omit<Household, 'id' | 'created_at'>): Household {
  const database = getDb();
  const res = database
    .prepare(
      `INSERT INTO households (event_id, members, address, email, phone, capacity, dietary)
       VALUES (@event_id, @members, @address, @email, @phone, @capacity, @dietary)`
    )
    .run(data);
  return getHousehold(res.lastInsertRowid as number)!;
}

export function updateHousehold(id: number, data: Partial<Pick<Household, 'members' | 'address' | 'email' | 'phone' | 'capacity' | 'dietary'>>): Household {
  const current = getHousehold(id);
  if (!current) throw new Error('Household not found');
  const merged = { ...current, ...data, id };
  getDb()
    .prepare(
      `UPDATE households SET members=@members, address=@address, email=@email,
       phone=@phone, capacity=@capacity, dietary=@dietary WHERE id=@id`
    )
    .run(merged);
  return getHousehold(id)!;
}

export function deleteHousehold(id: number): void {
  getDb().prepare('DELETE FROM households WHERE id = ?').run(id);
}

// ── Assignments ──────────────────────────────────────────────────────────────

export function getAssignments(eventId: number): Assignment[] {
  return getDb()
    .prepare('SELECT * FROM assignments WHERE event_id = ?')
    .all(eventId) as Assignment[];
}

export function saveAssignments(
  eventId: number,
  assignments: Array<{
    householdId: number;
    course: 'starter' | 'main' | 'dessert';
    visitsStarter: number | null;
    visitsMain: number | null;
    visitsDessert: number | null;
  }>
): void {
  const database = getDb();
  const tx = database.transaction(() => {
    // Preserve existing SMS sent flags
    const existing = new Map(
      (database.prepare('SELECT * FROM assignments WHERE event_id = ?').all(eventId) as Assignment[])
        .map((a) => [a.household_id, a])
    );
    database.prepare('DELETE FROM assignments WHERE event_id = ?').run(eventId);
    const ins = database.prepare(
      `INSERT INTO assignments
         (event_id, household_id, course, visits_starter, visits_main, visits_dessert,
          sms_advance_sent, sms_starter_sent, sms_main_sent, sms_dessert_sent)
       VALUES
         (@event_id, @household_id, @course, @visits_starter, @visits_main, @visits_dessert,
          @sms_advance_sent, @sms_starter_sent, @sms_main_sent, @sms_dessert_sent)`
    );
    for (const a of assignments) {
      const prev = existing.get(a.householdId);
      ins.run({
        event_id: eventId,
        household_id: a.householdId,
        course: a.course,
        visits_starter: a.visitsStarter,
        visits_main: a.visitsMain,
        visits_dessert: a.visitsDessert,
        sms_advance_sent: prev?.sms_advance_sent ?? 0,
        sms_starter_sent: prev?.sms_starter_sent ?? 0,
        sms_main_sent: prev?.sms_main_sent ?? 0,
        sms_dessert_sent: prev?.sms_dessert_sent ?? 0,
      });
    }
  });
  tx();
}

export function clearAssignments(eventId: number): void {
  getDb().prepare('DELETE FROM assignments WHERE event_id = ?').run(eventId);
}

export function markSmsSent(
  eventId: number,
  field: 'sms_advance_sent' | 'sms_starter_sent' | 'sms_main_sent' | 'sms_dessert_sent'
): void {
  getDb()
    .prepare(`UPDATE assignments SET ${field} = 1 WHERE event_id = ?`)
    .run(eventId);
}

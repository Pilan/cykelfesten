// Usage: node scripts/seed-admin.mjs
// Creates the full schema + inserts the admin account.
// Run with the dev server stopped.

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'cykelfesten.db');

const EMAIL = 'admin@cykelfesten.site';
const PASSWORD = 'tripadmin123';

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
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

const hash = bcrypt.hashSync(PASSWORD, 12);

const existing = db.prepare('SELECT id FROM admins WHERE email = ?').get(EMAIL);
if (existing) {
  db.prepare(
    'UPDATE admins SET password_hash = ?, email_verified = 1, verification_token = NULL, token_expires_at = NULL WHERE email = ?'
  ).run(hash, EMAIL);
  console.log(`✅ Admin uppdaterad: ${EMAIL}`);
} else {
  db.prepare(
    'INSERT INTO admins (email, password_hash, email_verified) VALUES (?, ?, 1)'
  ).run(EMAIL, hash);
  console.log(`✅ Admin skapad: ${EMAIL}`);
}

db.close();
console.log('Starta dev-servern med: npm run dev');

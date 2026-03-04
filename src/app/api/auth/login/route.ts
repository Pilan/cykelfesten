import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdmin } from '@/lib/db';
import { verifyPassword, createSessionToken, makeSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Saknade fält.' }, { status: 400 });
    }

    const admin = getAdmin(email);
    if (!admin || !admin.email_verified) {
      return NextResponse.json({ error: 'Felaktiga inloggningsuppgifter.' }, { status: 401 });
    }

    const valid = await verifyPassword(password, admin.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Felaktiga inloggningsuppgifter.' }, { status: 401 });
    }

    const token = createSessionToken(admin.id);
    const cookieStore = cookies();
    cookieStore.set(makeSessionCookie(token));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

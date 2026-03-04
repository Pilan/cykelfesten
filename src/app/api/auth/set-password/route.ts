import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminByToken, activateAdmin } from '@/lib/db';
import { hashPassword, createSessionToken, makeSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Saknade fält.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Lösenordet måste vara minst 8 tecken.' },
        { status: 400 }
      );
    }

    const admin = getAdminByToken(token);
    if (!admin || !admin.token_expires_at) {
      return NextResponse.json({ error: 'Ogiltig eller utgången länk.' }, { status: 400 });
    }

    if (new Date(admin.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Länken har gått ut.' }, { status: 400 });
    }

    const hash = await hashPassword(password);
    activateAdmin(token, hash);

    const sessionToken = createSessionToken(admin.id);
    const cookieStore = cookies();
    cookieStore.set(makeSessionCookie(sessionToken));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

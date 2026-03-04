import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdmin, createPendingAdmin } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Ogiltig e-postadress.' }, { status: 400 });
    }

    const existing = getAdmin(email);
    if (existing && existing.email_verified) {
      return NextResponse.json(
        { error: 'Kontot finns redan. Logga in istället.' },
        { status: 409 }
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    createPendingAdmin(email, token, expires);

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const link = `${appUrl}/admin/set-password?token=${token}`;
    await sendVerificationEmail(email, link);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAdminById } from '@/lib/db';

export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const admin = getAdminById(session.adminId);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ email: admin.email });
}

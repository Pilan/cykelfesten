import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  const origin = req.nextUrl.origin;
  return NextResponse.redirect(new URL('/admin/login', origin));
}

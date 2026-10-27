import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const { origin } = new URL(request.url);

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Sign-out error:', error);
  }

  const response = NextResponse.redirect(new URL('/login', origin));
  // Clear any test session cookie if in test mode
  if (process.env.NODE_ENV !== 'production' && process.env.PLAYWRIGHT_TEST === '1') {
    response.cookies.delete('e2e_test_session');
  }

  return response;
}

import { NextRequest, NextResponse } from 'next/server';
import { seed } from '@/lib/seed';
import { getSession, UserSession } from '@/lib/auth';

type AuthHandler = (request: NextRequest, session: UserSession) => Promise<NextResponse>;
type PublicHandler = (request: NextRequest) => Promise<NextResponse>;

export function withAuth(handler: AuthHandler) {
  return async (request: NextRequest) => {
    try {
      await seed();
      const session = getSession();
      if (!session) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
      return await handler(request, session);
    } catch (error) {
      let Sentry: any;
      try { Sentry = await import('@sentry/nextjs'); Sentry.captureException(error); } catch {}
      console.error('API error:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
  };
}

export function withPublic(handler: PublicHandler) {
  return async (request: NextRequest) => {
    try {
      await seed();
      return await handler(request);
    } catch (error) {
      let Sentry: any;
      try { Sentry = await import('@sentry/nextjs'); Sentry.captureException(error); } catch {}
      console.error('API error:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
  };
}

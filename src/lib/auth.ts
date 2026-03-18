import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import getDb from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'dimdim-secret-key-2026-super-safe';

export interface UserSession {
  id: number;
  username: string;
  nome: string;
  plano: string;
  modo_bot: string;
}

export function createToken(user: UserSession): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}

export function getSession(): UserSession | null {
  const cookieStore = cookies();
  const token = cookieStore.get('dimdim_session')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function requireAuth(): UserSession {
  const session = getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

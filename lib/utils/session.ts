import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export function getSessionId(request: Request | NextRequest): string {
  // Try to get session from cookies
  const cookieHeader = request.headers.get('cookie');
  console.log('Session - Cookie header:', cookieHeader);
  
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const sessionCookie = cookies.find(c => c.startsWith('session_id='));
    if (sessionCookie) {
      const sessionId = sessionCookie.split('=')[1];
      console.log('Session - Found existing session ID:', sessionId);
      return sessionId;
    }
  }
  
  // Generate new session ID if none exists
  const newSessionId = uuidv4();
  console.log('Session - Generated new session ID:', newSessionId);
  return newSessionId;
}

export function setSessionCookie(sessionId: string) {
  // This function is for reference - actual cookie setting happens in route handlers
  return {
    name: 'session_id',
    value: sessionId,
    httpOnly: true,
    secure: false, // Changed to false for development
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  };
} 
import type { Handle } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import type { ServerSession } from '$lib/types';

export const handle: Handle = async ({ event, resolve }) => {
    const sessionCookie = event.cookies.get('session');
    
    let session: ServerSession | null = null;
    try {
        session = sessionCookie ? JSON.parse(sessionCookie) : null;
    } catch (e) {
        event.cookies.delete('session', { path: '/' });
    }
    
    event.locals.session = session;
    event.locals.user = session?.user || null;

    // Only protect data endpoints, not the auth endpoint
    if (event.url.pathname.startsWith('/api/') && 
        !event.url.pathname.startsWith('/api/auth') && 
        !event.locals.user) {
        throw error(401, 'Unauthorized');
    }

    return resolve(event);
}; 
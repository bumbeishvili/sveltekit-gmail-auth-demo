import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = "382380825029-rnd0cj6b98nvf2ctd3kceohfjvo3m7ia.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(token: string) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error('No payload in token');
        }
        
        return {
            email: payload.email,
            name: payload.name,
            picture: payload.picture
        };
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
} 
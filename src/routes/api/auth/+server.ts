import { json } from '@sveltejs/kit';
import * as d3 from 'd3';
import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { verifyGoogleToken } from '$lib/server/auth';

const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ6hmCR_BMArUDnOpmc3ir3dGS3VQ4uBNaSOhuNFuuo_VUQgS-ovKYgGlNuJjs4Eq61ddNkECz-bynp/pub?gid=0&single=true&output=csv";

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const { token } = await request.json();
        
        if (!token) {
            throw error(401, 'No token provided');
        }

        // Verify the token and get user info
        const verifiedUser = await verifyGoogleToken(token);
        if (!verifiedUser) {
            throw error(401, 'Invalid token');
        }

        const { email, name, picture } = verifiedUser;

        // Fetch spreadsheet data on the server
        const response = await fetch(SPREADSHEET_URL);
        const csvText = await response.text();
        const data = d3.csvParse(csvText);
        
        const userRow = data.find(row => row.email === email);
        
        if (!userRow) {
            return json({ 
                success: false, 
                error: 'Access denied. Your email is not authorized.' 
            }, { status: 403 });
        }

        // Create session with user data and dataLink
        const session = {
            user: { 
                email, 
                name, 
                picture,
                dataLink: userRow.dataLink
            },
            token
        };

        // Set session cookie with secure settings
        cookies.set('session', JSON.stringify(session), {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 // 24 hours
        });

        return json({ 
            success: true,
            user: { 
                email, 
                name, 
                picture,
                dataLink: userRow.dataLink
            }
        });
        
    } catch (error) {
        console.error('Server auth error:', error);
        return json({ 
            success: false, 
            error: 'Server authentication error' 
        }, { status: 500 });
    }
}; 
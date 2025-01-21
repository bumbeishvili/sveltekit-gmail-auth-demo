import type { PageServerLoad } from './$types';
import * as d3 from 'd3';

export const load: PageServerLoad = async ({ locals }) => {
    // Log the entire locals object for initial debugging
    console.log('Locals object:', JSON.stringify(locals, null, 2));

    // Check if dataLink exists
    if (!locals.user?.dataLink) {
        console.log('No dataLink found in user session');
        return {
            userData: null,
            userDetails: {
                email: locals.user?.email,
                name: locals.user?.name,
                picture: locals.user?.picture,
                token: locals.user?.token,
            }
        };
    }

    try {
        // Log the dataLink before fetching
        console.log('Fetching data from:', locals.user.dataLink);

        // Fetch the actual data using the dataLink from the session
        const dataResponse = await fetch(locals.user.dataLink);

        // Log response status and headers
        console.log('Fetch Response Status:', dataResponse.status);
        console.log('Fetch Response Headers:', Object.fromEntries(dataResponse.headers));

        // Check if the response is ok
        if (!dataResponse.ok) {
            console.log(`HTTP error! status: ${dataResponse.status}`);
            throw new Error(`HTTP error! status: ${dataResponse.status}`);
        }

        const finalData = await dataResponse.text();
        
        // Log the raw text data
        console.log('Raw Data (first 500 chars):', finalData.substring(0, 500));

        const parsedData = d3.csvParse(finalData);

        // Log parsed data details
        console.log('Parsed Data:', {
            rowCount: parsedData.length,
            columns: parsedData.length > 0 ? Object.keys(parsedData[0]) : []
        });

        return {
            userData: parsedData,
            userDetails: {
                email: locals.user?.email,
                name: locals.user?.name,
                picture: locals.user?.picture,
                token: locals.user?.token,
                dataLink: locals.user?.dataLink
            }
        };
    } catch (error) {
        // Detailed error logging
        console.log('Data loading error:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
            dataLink: locals.user?.dataLink
        });

        return {
            userData: null,
            userDetails: {
                email: locals.user?.email,
                name: locals.user?.name,
                picture: locals.user?.picture,
                token: locals.user?.token
            }
        };
    }
}; 
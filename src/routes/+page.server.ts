import type { PageServerLoad } from './$types';
import * as d3 from 'd3';

const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ6hmCR_BMArUDnOpmc3ir3dGS3VQ4uBNaSOhuNFuuo_VUQgS-ovKYgGlNuJjs4Eq61ddNkECz-bynp/pub?gid=0&single=true&output=csv";

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user?.dataLink) {
        return {
            userData: null
        };
    }

    try {
        // Fetch the actual data using the dataLink from the session
        const dataResponse = await fetch(locals.user.dataLink);
        const finalData = await dataResponse.text();
        const parsedData = d3.csvParse(finalData);

        return {
            userData: parsedData
        };
    } catch (error) {
        console.error('Data loading error:', error);
        return {
            userData: null
        };
    }
}; 
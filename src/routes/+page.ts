// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production
export const prerender = true;

import type { PageLoad } from './$types';
import { user } from '$lib/stores/auth';

export const load: PageLoad = async ({ data }) => {
    // If we have user data from the server, update the client-side store
    if (data.userData) {
        user.set(data.user);
    }
    return data;
};

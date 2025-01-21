// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	// interface Error {}
	// interface Locals {}
	// interface PageData {}
	// interface Platform {}
	interface Locals {
		user: GoogleUser | null;
		session: ServerSession | null;
	}
}

/// <reference types="@sveltejs/kit" />

import type { GoogleUser, ServerSession } from '$lib/types';

declare global {
    interface Window {
        google: {
            accounts: {
                id: {
                    initialize: (config: any) => void;
                    renderButton: (element: HTMLElement, options: any) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

export {};

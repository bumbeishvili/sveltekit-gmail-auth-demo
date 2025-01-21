import { writable } from 'svelte/store';
import type { GoogleUser } from '$lib/types';

export const user = writable<GoogleUser | null>(null); 
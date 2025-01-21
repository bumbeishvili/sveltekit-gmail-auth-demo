import { writable } from 'svelte/store';

interface UserData {
  email?: string;
  name?: string;
  picture?: string;
  token?: string;
  dataLink?: string;
}

export const user = writable<UserData | null>(null); 
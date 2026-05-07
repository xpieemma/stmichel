import { writable } from 'svelte/store';

export const syncing = writable(false);
export const queued = writable(0);
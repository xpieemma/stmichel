import { writable } from 'svelte/store';

export interface AdminSession {
  username: string;
  role: 'admin' | 'decoy';
  active: boolean;
}

export const currentAdmin = writable<AdminSession | null>(null);

export function login(username: string, role: 'admin' | 'decoy') {
  currentAdmin.set({ username, role, active: true });
}

export function logout() {
  currentAdmin.set(null);
}

export function isDecoy(): boolean {
  let decoy = false;
  currentAdmin.subscribe(s => { decoy = s?.role === 'decoy'; })();
  return decoy;
}
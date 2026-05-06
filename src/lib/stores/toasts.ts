import { writable } from 'svelte/store';

interface Toast {
  id: number;
  message: string;
}

export const toasts = writable<Toast[]>([]);
let nextId = 0;

export function fakeToast(message: string) {
  const id = nextId++;
  toasts.update(t => [...t, { id, message }]);
  setTimeout(() => {
    toasts.update(t => t.filter(i => i.id !== id));
  }, 3000);
}
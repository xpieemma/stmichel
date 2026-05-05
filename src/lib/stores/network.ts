import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const isOnline = writable(true);

if (browser) {
  const update = () => isOnline.set(navigator.onLine);
  update();
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
}

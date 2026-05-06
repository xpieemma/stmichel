import { writable, get } from 'svelte/store';

/**
 * Stores the locked state and the username of the current admin.
 * When locked, the admin layout shows a PIN overlay.
 */
export const adminLocked = writable<{ locked: boolean; username: string | null }>({
  locked: false,
  username: null,
});

const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes
let lastActivity = Date.now();
let rafId = 0;
let eventAttached = false;

// Passive activity tracker – no CPU overhead when tab is inactive
function activityHandler() {
  lastActivity = Date.now();
}

function startActivityListeners() {
  if (eventAttached) return;
  eventAttached = true;
  const opts: AddEventListenerOptions = { passive: true };
  window.addEventListener('touchstart', activityHandler, opts);
  window.addEventListener('click', activityHandler, opts);
  window.addEventListener('scroll', activityHandler, opts);
  window.addEventListener('keydown', activityHandler, opts);
  window.addEventListener('mousemove', activityHandler, opts);
}

function stopActivityListeners() {
  if (!eventAttached) return;
  eventAttached = false;
  window.removeEventListener('touchstart', activityHandler);
  window.removeEventListener('click', activityHandler);
  window.removeEventListener('scroll', activityHandler);
  window.removeEventListener('keydown', activityHandler);
  window.removeEventListener('mousemove', activityHandler);
}

function checkInactivity() {
  const state = get(adminLocked);
  if (state.locked) {
    // already locked, stop checking until unlocked
    cancelAnimationFrame(rafId);
    return;
  }
  if (Date.now() - lastActivity > INACTIVITY_LIMIT) {
    adminLocked.set({ locked: true, username: get(adminLocked).username });
    stopActivityListeners();
    return;
  }
  rafId = requestAnimationFrame(checkInactivity);
}

/**
 * Start monitoring for inactivity. Call after successful admin login.
 * @param username the currently logged‑in admin username.
 */
export function startHeartbeat(username: string) {
  // Reset lock
  adminLocked.set({ locked: false, username });
  lastActivity = Date.now();
  startActivityListeners();
  rafId = requestAnimationFrame(checkInactivity);
}

/**
 * Stop monitoring and clear lock state. Call on logout.
 */
export function stopHeartbeat() {
  cancelAnimationFrame(rafId);
  stopActivityListeners();
  adminLocked.set({ locked: false, username: null });
}

/**
 * Unlock after a successful PIN check. Resumes the session.
 */
export function unlockSession(username: string) {
  adminLocked.set({ locked: false, username });
  lastActivity = Date.now();
  startActivityListeners();
  rafId = requestAnimationFrame(checkInactivity);
}
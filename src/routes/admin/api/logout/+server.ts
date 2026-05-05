import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { destroySession } from '$lib/server/admin-session';

export const POST: RequestHandler = async ({ cookies, platform }) => {
  await destroySession(cookies, platform?.env?.DB);
  return new Response(null, {
    status: 302,
    headers: { Location: '/admin/login' }
  });
};
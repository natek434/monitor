import { cookies, headers } from 'next/headers';

const ADMIN_COOKIE = 'admin-session';

export function requireAdmin() {
  const cookieStore = cookies();
  const value = cookieStore.get(ADMIN_COOKIE)?.value;
  if (value !== process.env.ADMIN_SECRET) {
    throw new Error('Unauthorized');
  }
}

export function isAdmin() {
  try {
    requireAdmin();
    return true;
  } catch (e) {
    return false;
  }
}

export function requireServiceToken() {
  const token = headers().get('x-service-token');
  if (!token || token !== process.env.N8N_SERVICE_TOKEN) {
    throw new Error('Unauthorized service');
  }
}

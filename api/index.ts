import { NextApiRequest, NextApiResponse } from 'next';
import { sendResponse } from './utils/response';

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>;
type ApiModule = { default: ApiHandler };
type ApiLoader = () => Promise<ApiModule>;

const routes: Record<string, ApiLoader> = {
  'auth/check-username': () => import('./auth/check-username'),
  'auth/login': () => import('./auth/login'),
  'auth/register': () => import('./auth/register'),
  'auth/reset-password': () => import('./auth/reset-password'),
  'auth/send-pin': () => import('./auth/send-pin'),
  'auth/verify-pin': () => import('./auth/verify-pin'),
  'creator-requests/create': () => import('./creator-requests/create'),
  'creator-requests/delete': () => import('./creator-requests/delete'),
  'creator-requests/get': () => import('./creator-requests/get'),
  'creator-requests/update': () => import('./creator-requests/update'),
  'event-categories/create': () => import('./event-categories/create'),
  'event-categories/delete': () => import('./event-categories/delete'),
  'event-categories/get': () => import('./event-categories/get'),
  'event-categories/update': () => import('./event-categories/update'),
  'event-redirects/create': () => import('./event-redirects/create'),
  'event-redirects/get': () => import('./event-redirects/get'),
  'event-registrations/create': () => import('./event-registrations/create'),
  'event-registrations/delete': () => import('./event-registrations/delete'),
  'event-registrations/get': () => import('./event-registrations/get'),
  'events/create': () => import('./events/create'),
  'events/delete': () => import('./events/delete'),
  'events/get': () => import('./events/get'),
  'events/pdf': () => import('./events/pdf'),
  'events/update': () => import('./events/update'),
  'favorites/get': () => import('./favorites/get'),
  'favorites/toggle': () => import('./favorites/toggle'),
  'follows/get': () => import('./follows/get'),
  'follows/toggle': () => import('./follows/toggle'),
  'supervisor-guests/create': () => import('./supervisor-guests/create'),
  'supervisor-guests/delete': () => import('./supervisor-guests/delete'),
  'supervisor-guests/get': () => import('./supervisor-guests/get'),
  'teams/create': () => import('./teams/create'),
  'teams/delete': () => import('./teams/delete'),
  'teams/get': () => import('./teams/get'),
  'teams/update': () => import('./teams/update'),
  'users/create': () => import('./users/create'),
  'users/delete': () => import('./users/delete'),
  'users/get': () => import('./users/get'),
  'users/update': () => import('./users/update'),
};

function normalizePath(pathValue: string | string[] | undefined): string {
  if (Array.isArray(pathValue)) {
    return pathValue.join('/');
  }

  return (pathValue ?? '')
    .split('?')[0]
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const path = normalizePath(req.query.path);
  const routeLoader = routes[path];

  if (!routeLoader) {
    return sendResponse(res, false, `Unknown API route: ${path || 'root'}`, null, 404);
  }

  try {
    const routeModule = await routeLoader();
    return routeModule.default(req, res);
  } catch (error) {
    console.error(`API dispatch failed for ${path}:`, error);
    return sendResponse(res, false, 'Internal server error', null, 500);
  }
}

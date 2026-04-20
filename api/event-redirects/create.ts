import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { event_id, user_id } = req.body;
    if (!event_id) return sendResponse(res, false, 'Missing event_id', null, 400);

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        if (user_id) {
            const [existing]: any = await conn.execute(
                'SELECT id FROM event_redirects WHERE event_id = ? AND user_id = ? LIMIT 1',
                [event_id, user_id]
            );
            if (existing && existing.length > 0) {
                return sendResponse(res, true, 'Redirect already logged', { id: existing[0].id }, 200);
            }
        }

        const id = randomUUID();
        await conn.execute(
            'INSERT INTO event_redirects (id, event_id, user_id) VALUES (?, ?, ?)',
            [id, event_id, user_id || null]
        );

        sendResponse(res, true, 'Redirect logged', { id }, 201);
    } catch (err) {
        console.error('Create redirect error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

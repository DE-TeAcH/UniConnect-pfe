import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { event_id, user_id } = req.body;
    if (!event_id || !user_id) return sendResponse(res, false, 'Missing event_id or user_id', null, 400);

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        // Check if already favorited
        const [existing]: any = await conn.execute(
            'SELECT event_id FROM favorite_events WHERE event_id = ? AND user_id = ?',
            [event_id, user_id]
        );

        if (existing.length) {
            // Remove favorite
            await conn.execute(
                'DELETE FROM favorite_events WHERE event_id = ? AND user_id = ?',
                [event_id, user_id]
            );
            sendResponse(res, true, 'Removed from favorites', { favorited: false });
        } else {
            // Add favorite
            await conn.execute(
                'INSERT INTO favorite_events (event_id, user_id) VALUES (?, ?)',
                [event_id, user_id]
            );
            sendResponse(res, true, 'Added to favorites', { favorited: true }, 201);
        }
    } catch (err) {
        console.error('Toggle favorite error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

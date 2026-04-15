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

        const [result]: any = await conn.execute(
            'DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?',
            [event_id, user_id]
        );

        if (result.affectedRows === 0) return sendResponse(res, false, 'Registration not found', null, 404);
        sendResponse(res, true, 'Registration cancelled');
    } catch (err) {
        console.error('Delete registration error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

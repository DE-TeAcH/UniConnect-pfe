import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'GET') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { username } = req.query;

    if (!username || typeof username !== 'string') {
        return sendResponse(res, false, 'Username is required', null, 400);
    }

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [rows]: any = await conn.execute(
            'SELECT id FROM users WHERE username = ? LIMIT 1',
            [username]
        );

        sendResponse(res, true, rows.length > 0 ? 'Username taken' : 'Username available', {
            available: rows.length === 0
        });
    } catch (err) {
        console.error('Check username error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

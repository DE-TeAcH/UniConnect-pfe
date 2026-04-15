import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'GET') return sendResponse(res, false, 'Method not allowed', null, 405);

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [rows] = await conn.execute('SELECT * FROM event_categories ORDER BY name ASC');
        sendResponse(res, true, 'Categories retrieved', rows);
    } catch (err) {
        console.error('Get categories error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

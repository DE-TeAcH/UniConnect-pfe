import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'GET') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { event_id } = req.query;

    let query = `SELECT er.*, u.name AS full_name, u.username, u.email
                 FROM event_redirects er
                 LEFT JOIN users u ON er.user_id = u.id
                 WHERE 1=1`;
    const params: any[] = [];

    if (event_id) {
        query += ' AND er.event_id = ?';
        params.push(event_id);
    }

    query += ' ORDER BY er.redirected_at DESC';

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [rows] = await conn.execute(query, params);
        sendResponse(res, true, 'Redirects retrieved', rows);
    } catch (err) {
        console.error('Get redirects error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

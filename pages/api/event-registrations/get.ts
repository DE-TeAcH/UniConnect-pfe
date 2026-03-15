import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'GET') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { event_id, user_id } = req.query;

    let query = `SELECT er.*, u.name AS user_name, u.email AS user_email, u.affiliation, e.title AS event_title
                 FROM event_registrations er
                 LEFT JOIN users u ON er.user_id = u.id
                 LEFT JOIN events e ON er.event_id = e.id
                 WHERE 1=1`;
    const params: any[] = [];

    if (event_id) {
        query += ' AND er.event_id = ?';
        params.push(event_id);
    }
    if (user_id) {
        query += ' AND er.user_id = ?';
        params.push(user_id);
    }

    query += ' ORDER BY er.applied_at DESC';

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [rows] = await conn.execute(query, params);
        sendResponse(res, true, 'Registrations retrieved', rows);
    } catch (err) {
        console.error('Get registrations error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'GET') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { user_id, event_id } = req.query;

    let query = `SELECT fe.*, e.title AS event_title, e.start_date, e.end_date, e.location AS event_location,
                        c.name AS category_name, u2.name AS creator_name
                 FROM favorite_events fe
                 LEFT JOIN events e ON fe.event_id = e.id
                 LEFT JOIN event_categories c ON e.category_id = c.id
                 LEFT JOIN users u2 ON e.creator_id = u2.id
                 WHERE 1=1`;
    const params: any[] = [];

    if (user_id) {
        query += ' AND fe.user_id = ?';
        params.push(user_id);
    }
    if (event_id) {
        query += ' AND fe.event_id = ?';
        params.push(event_id);
    }

    query += ' ORDER BY fe.favorited_at DESC';

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [rows] = await conn.execute(query, params);
        sendResponse(res, true, 'Favorites retrieved', rows);
    } catch (err) {
        console.error('Get favorites error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'GET') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { id } = req.query;

    let query = `SELECT 
                    t.*, 
                    u.name AS leader_name,
                    u.email AS leader_email,
                    u.role AS category,
                    (SELECT COUNT(*) FROM events e WHERE e.creator_id = u.id) AS total_events
                 FROM teams t
                 LEFT JOIN users u ON t.representative_id = u.id
                 WHERE 1=1`;
    const params: any[] = [];

    if (id) {
        query += ' AND t.id = ?';
        params.push(id);
    }

    query += ' ORDER BY t.created_at DESC';

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [rows] = await conn.execute(query, params);
        sendResponse(res, true, 'Teams retrieved', rows);
    } catch (err) {
        console.error('Get teams error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

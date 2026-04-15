import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'GET') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { follower_id, creator_id } = req.query;

    let query = `SELECT fc.*, 
                        u1.name AS follower_name, 
                        u2.name AS creator_name, u2.role AS creator_role
                 FROM follow_creators fc
                 LEFT JOIN users u1 ON fc.follower_id = u1.id
                 LEFT JOIN users u2 ON fc.creator_id = u2.id
                 WHERE 1=1`;
    const params: any[] = [];

    if (follower_id) {
        query += ' AND fc.follower_id = ?';
        params.push(follower_id);
    }
    if (creator_id) {
        query += ' AND fc.creator_id = ?';
        params.push(creator_id);
    }

    query += ' ORDER BY fc.followed_at DESC';

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [rows] = await conn.execute(query, params);
        sendResponse(res, true, 'Follows retrieved', rows);
    } catch (err) {
        console.error('Get follows error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

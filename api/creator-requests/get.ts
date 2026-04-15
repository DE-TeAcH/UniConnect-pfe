import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'GET') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { id } = req.query;

    let query = 'SELECT * FROM creator_requests WHERE 1=1';
    const params: any[] = [];

    if (id) {
        query += ' AND id = ?';
        params.push(id);
    }

    query += ' ORDER BY created_at DESC';

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [rows] = await conn.execute(query, params);
        sendResponse(res, true, 'Creator requests retrieved', rows);
    } catch (err) {
        console.error('Get creator requests error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

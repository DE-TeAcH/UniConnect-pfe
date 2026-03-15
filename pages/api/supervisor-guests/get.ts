import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'GET') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { event_id } = req.query;

    let query = 'SELECT * FROM supervisor_guests WHERE 1=1';
    const params: any[] = [];

    if (event_id) {
        query += ' AND event_id = ?';
        params.push(event_id);
    }

    query += ' ORDER BY name ASC';

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [rows] = await conn.execute(query, params);
        sendResponse(res, true, 'Supervisor guests retrieved', rows);
    } catch (err) {
        console.error('Get supervisor guests error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

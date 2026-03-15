import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { id, ids } = req.body;
    const toDelete = ids ? ids : id ? [id] : [];

    if (!toDelete.length) return sendResponse(res, false, 'Missing team id(s)', null, 400);

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const placeholders = toDelete.map(() => '?').join(',');
        const [result]: any = await conn.execute(
            `DELETE FROM teams WHERE id IN (${placeholders})`,
            toDelete
        );

        if (result.affectedRows === 0) return sendResponse(res, false, 'Team(s) not found', null, 404);
        sendResponse(res, true, `${result.affectedRows} team(s) deleted`);
    } catch (err) {
        console.error('Delete team error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

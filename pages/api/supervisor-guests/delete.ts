import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { id } = req.body;
    if (!id) return sendResponse(res, false, 'Missing supervisor guest id', null, 400);

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [result]: any = await conn.execute('DELETE FROM supervisor_guests WHERE id = ?', [id]);
        if (result.affectedRows === 0) return sendResponse(res, false, 'Supervisor guest not found', null, 404);

        sendResponse(res, true, 'Supervisor guest removed');
    } catch (err) {
        console.error('Delete supervisor guest error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

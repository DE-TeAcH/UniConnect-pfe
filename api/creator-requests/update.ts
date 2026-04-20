import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { id, action } = req.body;
    if (!id || !action) return sendResponse(res, false, 'Missing id or action', null, 400);

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        if (action === 'approve' || action === 'deny') {
            const [result]: any = await conn.execute('DELETE FROM creator_requests WHERE id = ?', [id]);
            if (result.affectedRows === 0) return sendResponse(res, false, 'Request not found', null, 404);
            sendResponse(res, true, `Request ${action === 'approve' ? 'approved' : 'denied'} and removed`);
        } else {
            sendResponse(res, false, 'Invalid action. Use approve or deny', null, 400);
        }
    } catch (err) {
        console.error('Update creator request error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

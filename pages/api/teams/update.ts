import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { id, ...updates } = req.body;
    if (!id) return sendResponse(res, false, 'Missing team id', null, 400);

    const allowedFields = ['representative_id', 'name', 'description', 'location'];
    const setClauses: string[] = [];
    const params: any[] = [];

    for (const key of allowedFields) {
        if (updates[key] !== undefined) {
            setClauses.push(`${key} = ?`);
            params.push(updates[key]);
        }
    }

    if (!setClauses.length) return sendResponse(res, false, 'No fields to update', null, 400);
    params.push(id);

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [result]: any = await conn.execute(
            `UPDATE teams SET ${setClauses.join(', ')} WHERE id = ?`,
            params
        );

        if (result.affectedRows === 0) return sendResponse(res, false, 'Team not found', null, 404);
        sendResponse(res, true, 'Team updated');
    } catch (err) {
        console.error('Update team error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

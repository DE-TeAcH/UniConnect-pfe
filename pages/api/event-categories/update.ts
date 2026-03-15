import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { id, name, uni_exclusive } = req.body;
    if (!id) return sendResponse(res, false, 'Missing category id', null, 400);

    const setClauses: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { setClauses.push('name = ?'); params.push(name); }
    if (uni_exclusive !== undefined) { setClauses.push('uni_exclusive = ?'); params.push(uni_exclusive); }

    if (!setClauses.length) return sendResponse(res, false, 'No fields to update', null, 400);
    params.push(id);

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [result]: any = await conn.execute(
            `UPDATE event_categories SET ${setClauses.join(', ')} WHERE id = ?`,
            params
        );

        if (result.affectedRows === 0) return sendResponse(res, false, 'Category not found', null, 404);
        sendResponse(res, true, 'Category updated');
    } catch (err) {
        console.error('Update category error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

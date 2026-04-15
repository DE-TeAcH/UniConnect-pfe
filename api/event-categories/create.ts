import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { name, uni_exclusive } = req.body;
    if (!name) return sendResponse(res, false, 'Missing category name', null, 400);

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const id = uuidv4();
        await conn.execute(
            'INSERT INTO event_categories (id, name, uni_exclusive) VALUES (?, ?, ?)',
            [id, name, uni_exclusive || false]
        );

        sendResponse(res, true, 'Category created', { id, name, uni_exclusive: uni_exclusive || false }, 201);
    } catch (err) {
        console.error('Create category error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

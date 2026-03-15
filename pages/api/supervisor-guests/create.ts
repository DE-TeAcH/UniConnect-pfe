import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { name, event_id, role } = req.body;
    if (!name || !event_id || !role) return sendResponse(res, false, 'Missing required fields', null, 400);

    if (!['reviewer', 'organizer'].includes(role)) {
        return sendResponse(res, false, 'Role must be reviewer or organizer', null, 400);
    }

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const id = uuidv4();
        await conn.execute(
            'INSERT INTO supervisor_guests (id, name, event_id, role) VALUES (?, ?, ?, ?)',
            [id, name, event_id, role]
        );

        sendResponse(res, true, 'Supervisor guest added', { id, name, role }, 201);
    } catch (err) {
        console.error('Create supervisor guest error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { representative_id, name, description, location } = req.body;

    if (!representative_id || !name || !location) {
        return sendResponse(res, false, 'Missing required fields', null, 400);
    }

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const { id: providedId, representative_id, name, description, location } = req.body;
        const id = providedId || randomUUID();

        await conn.execute(
            `INSERT INTO teams (id, representative_id, name, description, location) VALUES (?, ?, ?, ?, ?)`,
            [id, representative_id, name, description || null, location]
        );

        // Link user to team
        await conn.execute(
            'UPDATE users SET team_id = ? WHERE id = ?',
            [id, representative_id]
        );

        sendResponse(res, true, 'Team created', { id, name, location }, 201);
    } catch (err) {
        console.error('Create team error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

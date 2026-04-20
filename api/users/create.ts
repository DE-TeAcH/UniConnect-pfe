import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { role, name, email, username, password, affiliation, team_id, bac_matricule, bac_year, manage } = req.body;

    if (!name || !email || !username || !password || !role) {
        return sendResponse(res, false, 'Missing required fields', null, 400);
    }

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [existing]: any = await conn.execute(
            'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
            [username, email]
        );
        if (existing.length) {
            return sendResponse(res, false, 'Username or email already exists', null, 409);
        }

        const id = randomUUID();
        const password_hash = await bcrypt.hash(password, 10);

        await conn.execute(
            `INSERT INTO users (id, role, name, email, username, password_hash, affiliation, team_id, bac_matricule, bac_year, manage)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, role, name, email, username, password_hash, affiliation || null, team_id || null, bac_matricule || null, bac_year || null, manage !== undefined ? manage : true]
        );

        sendResponse(res, true, 'User created', { id, role, name, email, username }, 201);
    } catch (err) {
        console.error('Create user error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

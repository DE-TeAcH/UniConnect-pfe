import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { name, email, username, password, affiliation, bac_matricule, bac_year } = req.body;

    if (!name || !email || !username || !password) {
        return sendResponse(res, false, 'Missing required fields', null, 400);
    }

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        // Check if username or email already exists
        const [existing]: any = await conn.execute(
            'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
            [username, email]
        );
        if (existing.length) {
            return sendResponse(res, false, 'Username or email already exists', null, 409);
        }

        const id = uuidv4();
        const password_hash = await bcrypt.hash(password, 10);
        const role = email.includes('@etu.') ? 'student' : 'teacher';

        await conn.execute(
            `INSERT INTO users (id, role, name, email, username, password_hash, affiliation, bac_matricule, bac_year, manage)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
            [id, role, name, email, username, password_hash, affiliation || null, bac_matricule || null, bac_year || null]
        );

        sendResponse(res, true, 'Registration successful', { id, name, email, username, role }, 201);
    } catch (err) {
        console.error('Register error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

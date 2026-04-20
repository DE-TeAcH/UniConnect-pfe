import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { username, password } = req.body;

    if (!username || !password) {
        return sendResponse(res, false, 'Missing credentials', null, 400);
    }

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [rows]: any = await conn.execute(
            `SELECT u.*, t.name AS team_name
             FROM users u
             LEFT JOIN teams t ON u.team_id = t.id
             WHERE u.username = ? OR u.email = ?
             LIMIT 1`,
            [username, username]
        );

        if (!rows.length) {
            return sendResponse(res, false, 'User not found', null, 404);
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return sendResponse(res, false, 'Invalid password', null, 401);
        }

        const { password_hash, ...safeUser } = user;
        sendResponse(res, true, 'Login successful', safeUser);
    } catch (err) {
        console.error('Login error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

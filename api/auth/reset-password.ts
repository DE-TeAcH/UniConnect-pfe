import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { email, password } = req.body;

    if (!email || !password) {
        return sendResponse(res, false, 'Email and new password are required', null, 400);
    }

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        // Check user exists
        const [users]: any = await conn.execute(
            'SELECT id FROM users WHERE email = ? LIMIT 1',
            [email]
        );

        if (!users.length) {
            return sendResponse(res, false, 'No account found with this email', null, 404);
        }

        const password_hash = await bcrypt.hash(password, 10);

        await conn.execute(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [password_hash, email]
        );

        sendResponse(res, true, 'Password reset successfully');
    } catch (err) {
        console.error('Reset password error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

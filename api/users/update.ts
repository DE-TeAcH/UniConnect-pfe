import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { id, ...updates } = req.body;

    if (!id) return sendResponse(res, false, 'Missing user id', null, 400);

    const allowedFields = ['role', 'name', 'email', 'username', 'affiliation', 'team_id', 'bac_matricule', 'bac_year', 'manage', 'password'];
    const setClauses: string[] = [];
    const params: any[] = [];

    for (const key of allowedFields) {
        if (updates[key] !== undefined) {
            if (key === 'password') {
                setClauses.push('password_hash = ?');
                params.push(await bcrypt.hash(updates[key], 10));
            } else {
                setClauses.push(`${key} = ?`);
                params.push(updates[key]);
            }
        }
    }

    if (!setClauses.length) return sendResponse(res, false, 'No fields to update', null, 400);

    params.push(id);

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [result]: any = await conn.execute(
            `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`,
            params
        );

        if (result.affectedRows === 0) {
            return sendResponse(res, false, 'User not found', null, 404);
        }

        sendResponse(res, true, 'User updated');
    } catch (err: any) {
        console.error('Update user error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

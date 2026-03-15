import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { role, entity_name, representative_name, contact_email, requested_username, password, location, description } = req.body;

    if (!role || !entity_name || !representative_name || !contact_email || !requested_username || !password) {
        return sendResponse(res, false, 'Missing required fields', null, 400);
    }

    if (!['teacher', 'company'].includes(role)) {
        return sendResponse(res, false, 'Role must be teacher or company', null, 400);
    }

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        // Check if username or email already taken BY A CREATOR
        const [existingUsers]: any = await conn.execute(
            'SELECT id, manage FROM users WHERE username = ? OR email = ? LIMIT 1',
            [requested_username, contact_email]
        );
        if (existingUsers.length && existingUsers[0].manage === 1) {
            return sendResponse(res, false, 'This account is already a creator', null, 409);
        }

        const [existingRequests]: any = await conn.execute(
            'SELECT id FROM creator_requests WHERE requested_username = ? OR contact_email = ? LIMIT 1',
            [requested_username, contact_email]
        );
        if (existingRequests.length) {
            return sendResponse(res, false, 'A request with this username or email already exists', null, 409);
        }

        const id = uuidv4();
        const password_hash = await bcrypt.hash(password, 10);

        await conn.execute(
            `INSERT INTO creator_requests (id, role, entity_name, representative_name, contact_email, requested_username, password_hash, requested_password, location, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, role, entity_name, representative_name, contact_email, requested_username, password_hash, password, location, description]
        );

        sendResponse(res, true, 'Creator request submitted', { id }, 201);
    } catch (err) {
        console.error('Create creator request error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

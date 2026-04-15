import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import { generatePin, storePin } from '../utils/pinStore';
import { sendPinEmail } from '../utils/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { email, purpose } = req.body;

    if (!email || !purpose) {
        return sendResponse(res, false, 'Email and purpose are required', null, 400);
    }

    if (!['register', 'reset'].includes(purpose)) {
        return sendResponse(res, false, 'Purpose must be "register" or "reset"', null, 400);
    }

    try {
        // For password reset, verify the email exists in the database first
        if (purpose === 'reset') {
            const conn = db.getConnection();
            if (!conn) throw new Error('Database connection failed');

            const [users]: any = await conn.execute(
                'SELECT id FROM users WHERE email = ? LIMIT 1',
                [email]
            );

            if (!users.length) {
                return sendResponse(res, false, 'No account found with this email', null, 404);
            }
        }

        const pin = generatePin();
        storePin(email, pin, purpose);

        await sendPinEmail(email, pin, purpose);

        sendResponse(res, true, 'PIN sent successfully');
    } catch (err) {
        console.error('Send PIN error:', err);
        sendResponse(res, false, 'Failed to send PIN email. Please try again.', null, 500);
    }
}

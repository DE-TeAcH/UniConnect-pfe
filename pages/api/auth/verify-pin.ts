import { NextApiRequest, NextApiResponse } from 'next';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import { verifyPin } from '../utils/pinStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { email, pin, purpose } = req.body;

    if (!email || !pin || !purpose) {
        return sendResponse(res, false, 'Email, pin, and purpose are required', null, 400);
    }

    const isValid = verifyPin(email, pin, purpose);

    if (!isValid) {
        return sendResponse(res, false, 'Invalid or expired PIN', null, 400);
    }

    sendResponse(res, true, 'PIN verified successfully');
}

import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { follower_id, creator_id } = req.body;
    if (!follower_id || !creator_id) return sendResponse(res, false, 'Missing follower_id or creator_id', null, 400);

    if (follower_id === creator_id) return sendResponse(res, false, 'Cannot follow yourself', null, 400);

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [existing]: any = await conn.execute(
            'SELECT follower_id FROM follow_creators WHERE follower_id = ? AND creator_id = ?',
            [follower_id, creator_id]
        );

        if (existing.length) {
            await conn.execute(
                'DELETE FROM follow_creators WHERE follower_id = ? AND creator_id = ?',
                [follower_id, creator_id]
            );
            sendResponse(res, true, 'Unfollowed', { following: false });
        } else {
            await conn.execute(
                'INSERT INTO follow_creators (follower_id, creator_id) VALUES (?, ?)',
                [follower_id, creator_id]
            );
            sendResponse(res, true, 'Following', { following: true }, 201);
        }
    } catch (err) {
        console.error('Toggle follow error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

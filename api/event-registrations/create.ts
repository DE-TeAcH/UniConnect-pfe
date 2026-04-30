import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import { sendApplicationConfirmationEmail } from '../utils/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { event_id, user_id } = req.body;
    if (!event_id || !user_id) return sendResponse(res, false, 'Missing event_id or user_id', null, 400);

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        // Check if already registered
        const [existing]: any = await conn.execute(
            'SELECT event_id FROM event_registrations WHERE event_id = ? AND user_id = ?',
            [event_id, user_id]
        );
        if (existing.length) {
            return sendResponse(res, false, 'Already registered for this event', null, 409);
        }

        // Check capacity
        const [event]: any = await conn.execute('SELECT capacity FROM events WHERE id = ?', [event_id]);
        if (!event.length) return sendResponse(res, false, 'Event not found', null, 404);

        if (event[0].capacity) {
            const [count]: any = await conn.execute(
                'SELECT COUNT(*) AS total FROM event_registrations WHERE event_id = ?',
                [event_id]
            );
            if (count[0].total >= event[0].capacity) {
                return sendResponse(res, false, 'Event is full', null, 409);
            }
        }

        await conn.execute(
            'INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)',
            [event_id, user_id]
        );

        // Fetch user and event details to send email
        try {
            const [users]: any = await conn.execute('SELECT email, receive_notifications FROM users WHERE id = ?', [user_id]);
            const [events]: any = await conn.execute('SELECT title, start_date, start_time, location FROM events WHERE id = ?', [event_id]);
            
            if (users.length > 0 && events.length > 0) {
                const user = users[0];
                const eventInfo = events[0];
                if (user.receive_notifications !== false && user.receive_notifications !== 0) {
                    await sendApplicationConfirmationEmail(
                        user.email,
                        eventInfo.title,
                        eventInfo.start_date,
                        eventInfo.location,
                        eventInfo.start_time
                    );
                }
            }
        } catch (e) {
            console.error('Confirmation notification error:', e);
        }

        sendResponse(res, true, 'Registered successfully', null, 201);
    } catch (err) {
        console.error('Create registration error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

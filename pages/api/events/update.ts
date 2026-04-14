import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'POST') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { id, reviewers, organizers, ...updates } = req.body;
    if (!id) return sendResponse(res, false, 'Missing event id', null, 400);

    const allowedFields = ['title', 'category_id', 'laboratory', 'pdf_file', 'price_type', 'price', 'website', 'start_date', 'start_time', 'end_date', 'end_time', 'location', 'capacity', 'description'];
    const setClauses: string[] = [];
    const params: any[] = [];

    for (const key of allowedFields) {
        if (updates[key] !== undefined) {
            if (key === 'pdf_file') {
                setClauses.push('pdf_file = ?');
                params.push(Buffer.from(updates[key], 'base64'));
            } else {
                setClauses.push(`${key} = ?`);
                params.push(updates[key]);
            }
        }
    }

    if (!setClauses.length && reviewers === undefined && organizers === undefined) {
        return sendResponse(res, false, 'No fields to update', null, 400);
    }

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        if (setClauses.length) {
            params.push(id);
            const [result]: any = await conn.execute(
                `UPDATE events SET ${setClauses.join(', ')} WHERE id = ?`,
                params
            );
            if (result.affectedRows === 0) return sendResponse(res, false, 'Event not found', null, 404);
        }

        // Sync reviewers
        if (Array.isArray(reviewers)) {
            await conn.execute(`DELETE FROM supervisor_guests WHERE event_id = ? AND role = 'reviewer'`, [id]);
            for (const name of reviewers) {
                if (name && name.trim()) {
                    await conn.execute(
                        `INSERT INTO supervisor_guests (id, name, event_id, role) VALUES (UUID(), ?, ?, 'reviewer')`,
                        [name.trim(), id]
                    );
                }
            }
        }

        // Sync organizers
        if (Array.isArray(organizers)) {
            await conn.execute(`DELETE FROM supervisor_guests WHERE event_id = ? AND role = 'organizer'`, [id]);
            for (const name of organizers) {
                if (name && name.trim()) {
                    await conn.execute(
                        `INSERT INTO supervisor_guests (id, name, event_id, role) VALUES (UUID(), ?, ?, 'organizer')`,
                        [name.trim(), id]
                    );
                }
            }
        }

        sendResponse(res, true, 'Event updated');
    } catch (err) {
        console.error('Update event error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

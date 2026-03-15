import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import { v4 as uuidv4 } from 'uuid';

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

    const {
        creator_id, title, category_id, laboratory,
        pdf_file, price_type, price, website,
        start_date, start_time, end_date, end_time,
        location, capacity, description
    } = req.body;

    if (!creator_id || !title || !category_id || !start_date || !start_time || !end_date || !end_time || !location) {
        return sendResponse(res, false, 'Missing required fields', null, 400);
    }

    if (!pdf_file) {
        return sendResponse(res, false, 'PDF file is required', null, 400);
    }

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const id = uuidv4();
        // pdf_file is expected as a base64 string, convert to Buffer
        const pdfBuffer = Buffer.from(pdf_file, 'base64');

        await conn.execute(
            `INSERT INTO events (id, creator_id, title, category_id, laboratory, pdf_file, price_type, price, website, start_date, start_time, end_date, end_time, location, capacity, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, creator_id, title, category_id, laboratory || null, pdfBuffer, price_type || 'free', price || 0, website || null, start_date, start_time, end_date, end_time, location, capacity || null, description || null]
        );

        sendResponse(res, true, 'Event created', { id, title }, 201);
    } catch (err) {
        console.error('Create event error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

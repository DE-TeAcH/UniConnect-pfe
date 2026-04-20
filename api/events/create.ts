import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import { randomUUID } from 'crypto';
import { verifyEventPDF } from '../utils/aiVerify';

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
        location, capacity, description,
        reviewers, organizers
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

        const id = randomUUID();
        // pdf_file is expected as a base64 string, strip data URL prefix if present
        const base64Data = pdf_file.includes(',') ? pdf_file.split(',')[1] : pdf_file;
        const pdfBuffer = Buffer.from(base64Data, 'base64');

        // Fetch category name for better AI context
        let categoryName = '';
        try {
            const [cats]: any = await conn.execute('SELECT name FROM event_categories WHERE id = ?', [category_id]);
            if (cats.length > 0) categoryName = cats[0].name;
        } catch (_) {}

        let extraContext = '';
        try {
            const [users]: any = await conn.execute(
                `SELECT u.first_name, u.last_name, u.role, u.department, u.university, u.company_name, t.name AS team_name 
                 FROM users u LEFT JOIN teams t ON u.team_id = t.id 
                 WHERE u.id = ?`,
                [creator_id]
            );
            if (users.length > 0) {
                const u = users[0];
                extraContext += `\n- Creator Name: "${u.first_name} ${u.last_name}" (${u.role})`;
                if (u.company_name) extraContext += `\n- Company: "${u.company_name}"`;
                if (u.team_name) extraContext += `\n- Team: "${u.team_name}"`;
                if (u.department) extraContext += `\n- Department: "${u.department}"`;
                if (u.university) extraContext += `\n- University: "${u.university}"`;
            }
        } catch (_) {}

        if (Array.isArray(reviewers) && reviewers.length > 0) {
            extraContext += `\n- Reviewers/Advisors: ${reviewers.join(', ')}`;
        }
        if (Array.isArray(organizers) && organizers.length > 0) {
            extraContext += `\n- Organizers: ${organizers.join(', ')}`;
        }

        // AI PDF Verification
        const verification = await verifyEventPDF(pdfBuffer, {
            title, description, location,
            start_date, end_date, start_time, end_time,
            category_name: categoryName,
            laboratory,
            extra_context: extraContext
        });

        if (!verification.isValid) {
            return sendResponse(res, false, verification.reasoning, null, 400);
        }

        await conn.execute(
            `INSERT INTO events (id, creator_id, title, category_id, laboratory, pdf_file, price_type, price, website, start_date, start_time, end_date, end_time, location, capacity, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, creator_id, title, category_id, laboratory || null, pdfBuffer, price_type || 'free', price || 0, website || null, start_date, start_time, end_date, end_time, location, capacity || null, description || null]
        );

        // Insert reviewers into supervisor_guests
        if (Array.isArray(reviewers)) {
            for (const name of reviewers) {
                if (name && name.trim()) {
                    await conn.execute(
                        `INSERT INTO supervisor_guests (id, name, event_id, role) VALUES (UUID(), ?, ?, 'reviewer')`,
                        [name.trim(), id]
                    );
                }
            }
        }
        // Insert organizers into supervisor_guests
        if (Array.isArray(organizers)) {
            for (const name of organizers) {
                if (name && name.trim()) {
                    await conn.execute(
                        `INSERT INTO supervisor_guests (id, name, event_id, role) VALUES (UUID(), ?, ?, 'organizer')`,
                        [name.trim(), id]
                    );
                }
            }
        }

        sendResponse(res, true, 'Event created', { id, title }, 201);
    } catch (err) {
        console.error('Create event error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

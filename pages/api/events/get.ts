import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'GET') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { id, creator_id, category_id, search, sort_by, sort_order } = req.query;

    let query = `SELECT e.id, e.creator_id, e.title, e.description, e.location, e.start_date, e.start_time, e.end_date, e.end_time, e.capacity, e.price_type, e.price, e.website, e.category_id, e.laboratory, e.created_at,
                        (e.pdf_file IS NOT NULL) AS has_pdf,
                        c.name AS category_name, c.uni_exclusive,
                        u.name AS creator_name, u.role AS creator_role,
                        t.name AS team_name,
                        (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) AS registration_count,
                        (SELECT COUNT(*) FROM event_redirects erd WHERE erd.event_id = e.id) AS redirect_count,
                        (SELECT GROUP_CONCAT(sg.name SEPARATOR '|') FROM supervisor_guests sg WHERE sg.event_id = e.id AND sg.role = 'reviewer') AS reviewers_str,
                        (SELECT GROUP_CONCAT(sg.name SEPARATOR '|') FROM supervisor_guests sg WHERE sg.event_id = e.id AND sg.role = 'organizer') AS organizers_str
                 FROM events e
                 LEFT JOIN event_categories c ON e.category_id = c.id
                 LEFT JOIN users u ON e.creator_id = u.id
                 LEFT JOIN teams t ON u.team_id = t.id
                 WHERE 1=1`;
    const params: any[] = [];

    if (id) {
        query += ' AND e.id = ?';
        params.push(id);
    }
    if (creator_id) {
        query += ' AND e.creator_id = ?';
        params.push(creator_id);
    }
    if (category_id) {
        query += ' AND e.category_id = ?';
        params.push(category_id);
    }
    if (search) {
        query += ' AND (e.title LIKE ? OR e.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    const order = sort_order === 'asc' ? 'ASC' : 'DESC';
    if (sort_by === 'title') {
        query += ` ORDER BY e.title ${order}`;
    } else if (sort_by === 'price') {
        query += ` ORDER BY e.price ${order}`;
    } else {
        query += ` ORDER BY e.start_date ${order}, e.start_time ${order}`;
    }

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [rows]: any = await conn.execute(query, params);
        const mapped = (rows as any[]).map((r: any) => ({
            ...r,
            is_paid: r.price_type === 'paid',
            join_url: r.website,
            registration_count: r.price_type === 'paid' ? r.redirect_count : r.registration_count,
            reviewers: r.reviewers_str ? r.reviewers_str.split('|') : [],
            organizers: r.organizers_str ? r.organizers_str.split('|') : [],
            reviewers_str: undefined,
            organizers_str: undefined,
            redirect_count: undefined,
        }));
        sendResponse(res, true, 'Events retrieved', mapped);
    } catch (err) {
        console.error('Get events error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

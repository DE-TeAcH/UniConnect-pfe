import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'GET') return sendResponse(res, false, 'Method not allowed', null, 405);

    const { role, team_id, id, email, username } = req.query;

    let query = `SELECT u.id, u.role, u.name as full_name, u.email, u.username, u.affiliation as faculty, u.team_id, u.bac_matricule, u.bac_year, u.manage, u.receive_notifications, u.created_at,
                        t.name AS team_name, t.location,
                        (SELECT COUNT(*) FROM events e WHERE e.creator_id = u.id) AS event_count,
                        (SELECT COUNT(*) FROM follow_creators f WHERE f.creator_id = u.id) AS follower_count
                 FROM users u
                 LEFT JOIN teams t ON u.team_id = t.id
                 WHERE 1=1`;
    const params: any[] = [];

    if (id) {
        query += ' AND u.id = ?';
        params.push(id);
    }
    if (role) {
        query += ' AND u.role = ?';
        params.push(role);
    }
    if (team_id) {
        query += ' AND u.team_id = ?';
        params.push(team_id);
    }
    if (email) {
        query += ' AND u.email = ?';
        params.push(email);
    }
    if (username) {
        query += ' AND u.username = ?';
        params.push(username);
    }

    query += ' ORDER BY u.created_at DESC';

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [rows] = await conn.execute(query, params);
        sendResponse(res, true, 'Users retrieved', rows);
    } catch (err) {
        console.error('Get users error:', err);
        sendResponse(res, false, 'Internal server error', null, 500);
    }
}

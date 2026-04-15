import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';

export const config = {
    api: {
        responseLimit: '15mb',
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;
    if (req.method !== 'GET') {
        res.status(405).json({ success: false, message: 'Method not allowed' });
        return;
    }

    const { id } = req.query;

    if (!id) {
        res.status(400).json({ success: false, message: 'Missing event id' });
        return;
    }

    try {
        const conn = db.getConnection();
        if (!conn) throw new Error('Database connection failed');

        const [rows]: any = await conn.execute(
            'SELECT pdf_file FROM events WHERE id = ? LIMIT 1',
            [id]
        );

        if (!rows || rows.length === 0 || !rows[0].pdf_file) {
            res.status(404).json({ success: false, message: 'PDF not found' });
            return;
        }

        const pdfBuffer = rows[0].pdf_file;
        
        // Ensure returning clean PDF response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="event-${id}-proof.pdf"`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error('Get PDF error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

import { NextApiResponse } from 'next';

export function sendResponse(
    res: NextApiResponse,
    success: boolean,
    message: string,
    data: any = null,
    statusCode: number = 200
) {
    res.status(statusCode).json({ success, message, data });
}

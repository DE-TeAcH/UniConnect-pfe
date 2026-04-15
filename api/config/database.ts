import mysql from 'mysql2/promise';

class Database {
    private pool: mysql.Pool | null = null;

    public getConnection() {
        if (!this.pool) {
            try {
                this.pool = mysql.createPool({
                    host: process.env.DB_HOST,
                    port: Number(process.env.DB_PORT),
                    user: process.env.DB_USER,
                    password: process.env.DB_PASS,
                    database: process.env.DB_NAME,
                    waitForConnections: true,
                    connectionLimit: 10,
                    queueLimit: 0,
                    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
                });
            } catch (err) {
                console.error('DB Connection Failed:', err);
            }
        }
        return this.pool;
    }
}

export default new Database();

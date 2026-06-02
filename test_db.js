const mysql = require('mysql2');

async function test() {
    const conn = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    }).promise();
    
    try {
        const [rows] = await conn.execute('DESCRIBE event_redirects');
        console.log("event_redirects schema:", rows);
    } catch (e) {
        console.error("DB Error:", e);
    }
    process.exit();
}

test();

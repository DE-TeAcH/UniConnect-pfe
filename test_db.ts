const db = require('./api/config/database');

async function test() {
    const conn = db.default.getConnection();
    try {
        const [rows] = await conn.execute('DESCRIBE event_redirects');
        console.log("event_redirects schema:", rows);
    } catch (e) {
        console.error("DB Error:", e);
    }
    process.exit();
}

test();

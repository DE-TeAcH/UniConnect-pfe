const mysql = require('mysql2/promise');

async function testConnection() {
    console.log("Testing connection...");
    try {
        const conn = await mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
            database: "ts_manager"
        });
        console.log("Connection successful!");
        await conn.end();
    } catch (e) {
        console.error("Connection failed:", e.message);
    }
}

testConnection();

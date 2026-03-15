const mysql = require('mysql2/promise');

async function main() {
    console.log('🔌 Connecting to TiDB...');
    const conn = await mysql.createConnection({
        host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
        port: 4000,
        user: '41Tn5YK91RtTw7b.root',
        password: 'Jb4fom5g1YA41bRe',
        database: 'uniconnect',
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    });

    console.log('✅ Connected!');

    // Set team_id to NULL for all students
    const [result] = await conn.execute(
        'UPDATE users SET team_id = NULL WHERE role = "student"'
    );

    console.log(`\n🧹 Removed team assignments from ${result.affectedRows} students.`);

    // Verify
    const [teams] = await conn.query(`
        SELECT t.name, COUNT(u.id) as members 
        FROM teams t 
        LEFT JOIN users u ON u.team_id = t.id 
        GROUP BY t.id
    `);

    console.log('\n📊 Current members per team:');
    console.table(teams);

    await conn.end();
}

main().catch(console.error);

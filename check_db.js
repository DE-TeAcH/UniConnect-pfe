const mysql = require('mysql2/promise');

async function check() {
    const conn = await mysql.createConnection({
        host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
        port: 4000,
        user: '41Tn5YK91RtTw7b.root',
        password: 'Jb4fom5g1YA41bRe',
        database: 'uniconnect',
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    });

    // Check teams
    const [t] = await conn.query('SELECT t.name as team, COUNT(u.id) as members FROM teams t LEFT JOIN users u ON u.team_id = t.id GROUP BY t.id');
    console.log("Teams and member counts:", JSON.stringify(t, null, 2));

    // Check bac details
    const [u] = await conn.query('SELECT role, COUNT(id) as cnt, SUM(CASE WHEN bac_matricule IS NOT NULL THEN 1 ELSE 0 END) as with_bac FROM users GROUP BY role');
    console.log("Users and BAC details:", JSON.stringify(u, null, 2));

    // Check events
    const [e] = await conn.query('SELECT role, COUNT(e.id) as event_count FROM events e JOIN users u ON e.creator_id = u.id GROUP BY role');
    console.log("Events per creator role:", JSON.stringify(e, null, 2));

    await conn.end();
}

check().catch(console.error);

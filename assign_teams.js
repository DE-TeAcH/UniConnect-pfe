const mysql = require('mysql2/promise');

async function main() {
    console.log('🔌 Connecting to TiDB Cloud...');
    const conn = await mysql.createConnection({
        host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
        port: 4000,
        user: '41Tn5YK91RtTw7b.root',
        password: 'Jb4fom5g1YA41bRe',
        database: 'uniconnect',
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    });
    console.log('✅ Connected!\n');

    // 1. Get all teams
    const [teams] = await conn.query('SELECT id, name FROM teams');
    console.log(`Found ${teams.length} teams.`);

    // 2. Get all students who don't have a team yet
    const [students] = await conn.query('SELECT id, username FROM users WHERE role = "student" AND team_id IS NULL');
    console.log(`Found ${students.length} students without a team.`);

    if (students.length === 0) {
        console.log('No students available to assign. Exiting.');
        await conn.end();
        return;
    }

    // 3. Distribute students among teams
    let updates = 0;
    for (let i = 0; i < students.length; i++) {
        // Assign each student to a team in a round-robin fashion
        const team = teams[i % teams.length];
        const student = students[i];

        await conn.execute('UPDATE users SET team_id = ? WHERE id = ?', [team.id, student.id]);
        console.log(`Assigned student ${student.username} to team ${team.name}`);
        updates++;
    }

    console.log(`\n✅ Successfully updated ${updates} students with team assignments!`);

    await conn.end();
    console.log('🔌 Connection closed.');
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});

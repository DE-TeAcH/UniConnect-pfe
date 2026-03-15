const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

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

    // hash password
    const hash = await bcrypt.hash('Pass1234', 10);
    console.log('🔐 Password hash generated (password: Pass1234)\n');

    // ============================================================
    // STUDENTS (NO TEAMS)
    // ============================================================

    const students = [
        { id: uuidv4(), name: 'Mehdi Rahmani', email: 'mehdi.r@usthb.dz', username: 'mehdi.r', affiliation: 'L3 Computer Science - USTHB', bac_matricule: '20210567', bac_year: 2021 },
        { id: uuidv4(), name: 'Lina Aissaoui', email: 'lina.a@usthb.dz', username: 'lina.a', affiliation: 'M1 Software Engineering - USTHB', bac_matricule: '20200412', bac_year: 2020 },
        { id: uuidv4(), name: 'Khaled Djebbari', email: 'khaled.d@usthb.dz', username: 'khaled.d', affiliation: 'L2 Electronics - USTHB', bac_matricule: '20220198', bac_year: 2022 },
        { id: uuidv4(), name: 'Nadia Boudali', email: 'nadia.b@univ-alger.dz', username: 'nadia.b', affiliation: 'L3 Biology - Univ. Algiers 1', bac_matricule: '20210839', bac_year: 2021 },
        { id: uuidv4(), name: 'Rafik Hamdi', email: 'rafik.h@esi.dz', username: 'rafik.h', affiliation: '2CS - ESI', bac_matricule: '20200654', bac_year: 2020 },
        { id: uuidv4(), name: 'Amira Zeroual', email: 'amira.z@esi.dz', username: 'amira.z', affiliation: '1CS - ESI', bac_matricule: '20210723', bac_year: 2021 },
        { id: uuidv4(), name: 'Youcef Belkadi', email: 'youcef.b@usthb.dz', username: 'youcef.b', affiliation: 'M2 Networks - USTHB', bac_matricule: '20190345', bac_year: 2019 },
        { id: uuidv4(), name: 'Imane Cherif', email: 'imane.c@usthb.dz', username: 'imane.c', affiliation: 'L3 Computer Science - USTHB', bac_matricule: '20210901', bac_year: 2021 },
        { id: uuidv4(), name: 'Abdelkader Bouzid', email: 'abd.bouzid@esi.dz', username: 'abd.bouzid', affiliation: '3CS - ESI', bac_matricule: '20190112', bac_year: 2019 },
        { id: uuidv4(), name: 'Meriem Hadjar', email: 'meriem.h@univ-alger.dz', username: 'meriem.h', affiliation: 'M1 Biochemistry - Univ. Algiers 1', bac_matricule: '20200587', bac_year: 2020 },
        { id: uuidv4(), name: 'Sofiane Larbi', email: 'sofiane.l@usthb.dz', username: 'sofiane.l', affiliation: 'L2 Mathematics - USTHB', bac_matricule: '20220334', bac_year: 2022 },
        { id: uuidv4(), name: 'Chaima Bensalem', email: 'chaima.b@esi.dz', username: 'chaima.b', affiliation: '1CS - ESI', bac_matricule: '20220456', bac_year: 2022 },
    ];

    // ============================================================
    // INSERT STUDENTS
    // ============================================================

    console.log('📋 Inserting students...');

    for (const s of students) {

        await conn.execute(
            `INSERT INTO users 
            (id, role, name, email, username, password_hash, affiliation, team_id, bac_matricule, bac_year, manage)
            VALUES (?, 'student', ?, ?, ?, ?, ?, NULL, ?, ?, false)`,
            [
                s.id,
                s.name,
                s.email,
                s.username,
                hash,
                s.affiliation,
                s.bac_matricule,
                s.bac_year
            ]
        );

    }

    console.log(`✅ ${students.length} students inserted.`);

    console.log('\n==============================');
    console.log('🎉 STUDENT SEED COMPLETE');
    console.log('==============================');
    console.log('🔑 Password for all students: Pass1234');

    await conn.end();
    console.log('🔌 Connection closed.');

}

main().catch(err => {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
});
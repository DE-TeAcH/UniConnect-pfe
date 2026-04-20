const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function test() {
  const conn = await mysql.createConnection({
    host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '41Tn5YK91RtTw7b.root',
    password: 'Jb4fom5g1YA41bRe',
    database: 'uniconnect',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });

  const name = "Test User";
  const email = "test." + Date.now() + "@etu.univ-mosta.dz";
  const username = "testuser" + Date.now();
  const password = "password";
  const affiliation = "FSEI";
  const bac_matricule = "37295703";
  const bac_year = 2023;

  const id = uuidv4();
  const password_hash = await bcrypt.hash(password, 10);
  const role = 'student';

  try {
    await conn.execute(
        `INSERT INTO users (id, role, name, email, username, password_hash, affiliation, bac_matricule, bac_year, manage)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
        [id, role, name, email, username, password_hash, affiliation || null, bac_matricule || null, bac_year || null]
    );
    console.log("Success");
  } catch (err) {
    console.error("error:", err);
  }

  await conn.end();
}

test().catch(console.error);

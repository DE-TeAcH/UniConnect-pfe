const mysql = require('mysql2/promise');

async function test() {
  const conn = await mysql.createConnection({
    host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '41Tn5YK91RtTw7b.root',
    password: 'Jb4fom5g1YA41bRe',
    database: 'uniconnect',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });

  const [rows] = await conn.execute('DESCRIBE users;');
  console.log(rows);
  await conn.end();
}

test().catch(console.error);

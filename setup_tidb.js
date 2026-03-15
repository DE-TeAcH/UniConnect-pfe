const mysql = require('mysql2/promise');

async function main() {
  console.log('🔌 Connecting to TiDB Cloud...');

  const conn = await mysql.createConnection({
    host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '41Tn5YK91RtTw7b.root',
    password: 'Jb4fom5g1YA41bRe',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    multipleStatements: true,
  });

  console.log('✅ Connected to TiDB Cloud!');

  // Create database
  console.log('\n📦 Creating database "uniconnect"...');
  await conn.query('CREATE DATABASE IF NOT EXISTS `uniconnect`;');
  await conn.query('USE `uniconnect`;');
  console.log('✅ Database "uniconnect" ready.');

  // 1. teams table
  console.log('\n📋 Creating table "teams"...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS teams (
      id CHAR(36) NOT NULL DEFAULT (UUID()),
      representative_id CHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      location VARCHAR(255) NOT NULL,
      PRIMARY KEY (id)
    );
  `);
  console.log('✅ teams created.');

  // 2. users table
  console.log('📋 Creating table "users"...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) NOT NULL DEFAULT (UUID()),
      role ENUM('student','teacher','admin','company','team-leader') NOT NULL DEFAULT 'student',
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      username VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      affiliation VARCHAR(255) DEFAULT NULL,
      team_id CHAR(36) DEFAULT NULL,
      bac_matricule VARCHAR(8) DEFAULT NULL,
      bac_year INT DEFAULT NULL,
      manage BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    );
  `);
  console.log('✅ users created.');

  // Add FK from teams.representative_id -> users.id
  console.log('🔗 Adding FK: teams.representative_id -> users.id...');
  try {
    await conn.query(`
      ALTER TABLE teams ADD CONSTRAINT fk_teams_representative
        FOREIGN KEY (representative_id) REFERENCES users(id) ON DELETE CASCADE;
    `);
    console.log('✅ FK added.');
  } catch (e) {
    if (e.code === 'ER_DUP_KEYNAME' || e.errno === 1061 || e.errno === 1826) {
      console.log('⚠️  FK already exists, skipping.');
    } else {
      throw e;
    }
  }

  // 3. creator_requests table
  console.log('📋 Creating table "creator_requests"...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS creator_requests (
      id CHAR(36) NOT NULL DEFAULT (UUID()),
      role ENUM('teacher','company') NOT NULL,
      entity_name VARCHAR(255) NOT NULL,
      representative_name VARCHAR(255) NOT NULL,
      contact_email VARCHAR(255) NOT NULL,
      requested_username VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    );
  `);
  console.log('✅ creator_requests created.');

  // 4. event_categories table
  console.log('📋 Creating table "event_categories"...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS event_categories (
      id CHAR(36) NOT NULL DEFAULT (UUID()),
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      uni_exclusive BOOLEAN NOT NULL DEFAULT FALSE,
      PRIMARY KEY (id)
    );
  `);
  console.log('✅ event_categories created.');

  // 5. events table
  console.log('📋 Creating table "events"...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS events (
      id CHAR(36) NOT NULL DEFAULT (UUID()),
      creator_id CHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      category_id CHAR(36) NOT NULL,
      laboratory VARCHAR(255) DEFAULT NULL,
      pdf_file LONGBLOB NOT NULL,
      price_type ENUM('free','paid') NOT NULL DEFAULT 'free',
      price DECIMAL(10,2) DEFAULT 0.00,
      website VARCHAR(500) DEFAULT NULL,
      start_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_date DATE NOT NULL,
      end_time TIME NOT NULL,
      location VARCHAR(255) NOT NULL,
      capacity INT DEFAULT NULL,
      description TEXT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      CONSTRAINT fk_events_creator FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_events_category FOREIGN KEY (category_id) REFERENCES event_categories(id) ON DELETE CASCADE
    );
  `);
  console.log('✅ events created.');

  // 6. event_registrations table
  console.log('📋 Creating table "event_registrations"...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS event_registrations (
      event_id CHAR(36) NOT NULL,
      user_id CHAR(36) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (event_id, user_id),
      CONSTRAINT fk_registrations_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      CONSTRAINT fk_registrations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  console.log('✅ event_registrations created.');

  // 7. event_redirects table
  console.log('📋 Creating table "event_redirects"...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS event_redirects (
      id CHAR(36) NOT NULL DEFAULT (UUID()),
      event_id CHAR(36) NOT NULL,
      user_id CHAR(36) DEFAULT NULL,
      redirected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      CONSTRAINT fk_redirects_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      CONSTRAINT fk_redirects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);
  console.log('✅ event_redirects created.');

  // 8. favorite_events table
  console.log('📋 Creating table "favorite_events"...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS favorite_events (
      event_id CHAR(36) NOT NULL,
      user_id CHAR(36) NOT NULL,
      favorited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (event_id, user_id),
      CONSTRAINT fk_favorites_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  console.log('✅ favorite_events created.');

  // 9. follow_creators table
  console.log('📋 Creating table "follow_creators"...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS follow_creators (
      follower_id CHAR(36) NOT NULL,
      creator_id CHAR(36) NOT NULL,
      followed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (follower_id, creator_id),
      CONSTRAINT fk_follow_follower FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_follow_creator FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  console.log('✅ follow_creators created.');

  // 10. supervisor_guests table
  console.log('📋 Creating table "supervisor_guests"...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS supervisor_guests (
      id CHAR(36) NOT NULL DEFAULT (UUID()),
      name VARCHAR(255) NOT NULL,
      event_id CHAR(36) NOT NULL,
      role ENUM('reviewer','organizer') NOT NULL,
      PRIMARY KEY (id),
      CONSTRAINT fk_supervisors_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );
  `);
  console.log('✅ supervisor_guests created.');

  // Verify all tables
  console.log('\n🔍 Verifying tables...');
  const [tables] = await conn.query('SHOW TABLES;');
  console.log('\n📊 Tables in "uniconnect" database:');
  tables.forEach((row, i) => {
    const tableName = Object.values(row)[0];
    console.log(`   ${i + 1}. ${tableName}`);
  });

  console.log(`\n🎉 All ${tables.length} tables created successfully!`);

  await conn.end();
  console.log('🔌 Connection closed.');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

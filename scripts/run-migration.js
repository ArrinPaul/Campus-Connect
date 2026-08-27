const fs = require('fs');
const { Client } = require('pg');

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('No DATABASE_URL found in environment');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();

    const migrationPath = fs.existsSync('supabase/migrations/20240101000000_init.sql')
      ? 'supabase/migrations/20240101000000_init.sql'
      : 'supabase/migration.sql';
    console.log(`Reading ${migrationPath}...`);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration...');
    await client.query(sql);

    console.log('Migration executed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();

const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.urxgegqlyzvvvdyukjrg:Campus_connect11@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000
});

async function checkDb() {
  try {
    await client.connect();
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
    console.log('--- TABLES IN PUBLIC SCHEMA ---');
    res.rows.forEach(r => console.log(r.table_name));
    console.log('---');
    console.log('TOTAL TABLES: ' + res.rows.length);
  } catch (err) {
    console.error('Error connecting to DB:', err.message);
  } finally {
    await client.end();
  }
}
checkDb();

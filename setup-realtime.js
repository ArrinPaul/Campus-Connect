const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

async function enableRealtime() {
  if (!DATABASE_URL) {
    console.error("Error: Please provide DATABASE_URL or SUPABASE_DATABASE_URL in environment variables.");
    process.exit(1);
  }

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Enable realtime for the tables we need
    const queries = [
      `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`,
      `ALTER PUBLICATION supabase_realtime ADD TABLE posts;`,
      `ALTER PUBLICATION supabase_realtime ADD TABLE notifications;`,
      `ALTER PUBLICATION supabase_realtime ADD TABLE comments;`,
      `ALTER PUBLICATION supabase_realtime ADD TABLE reactions;`,
      `ALTER TABLE messages REPLICA IDENTITY FULL;`,
      `ALTER TABLE posts REPLICA IDENTITY FULL;`,
      `ALTER TABLE notifications REPLICA IDENTITY FULL;`,
      `ALTER TABLE comments REPLICA IDENTITY FULL;`,
      `ALTER TABLE reactions REPLICA IDENTITY FULL;`
    ];

    for (const query of queries) {
      try {
        await client.query(query);
        console.log(`Executed: ${query}`);
      } catch (err) {
        console.log(`Failed or already added: ${query} - ${err.message}`);
      }
    }
    console.log("Realtime enabled successfully");
  } catch (err) {
    console.error("Error connecting or executing:", err);
  } finally {
    await client.end();
  }
}

enableRealtime();

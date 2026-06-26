const { Client } = require('pg');
require('dotenv').config({ path: '../../.env' }); // Adjusted to load from Backend root

const createDatabase = async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    database: 'postgres' // connect to default DB to create a new one
  });

  try {
    await client.connect();
    const dbName = process.env.DB_NAME || 'QR_Attandance';
    const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${dbName}'`);
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" not found, creating it.`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error('Error creating database:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
};

createDatabase();

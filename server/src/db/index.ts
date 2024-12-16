import { createPool, PoolOptions } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig: PoolOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

export const pool = createPool(dbConfig);

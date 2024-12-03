import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db";
import { ForumPost, PaginationParams, ApiResponse } from "./types";
import { RowDataPacket } from 'mysql2';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.SERVER_PORT || 5000;

interface ForumPostRow extends ForumPost, RowDataPacket {}
interface TotalCountRow extends RowDataPacket {
  total: number;
}

// Single /api/posts route handler
app.get("/api/posts", async (req: Request, res: Response) => {
  try {
    const page = parseInt(String(req.query.page)) || 1;
    const limit = parseInt(String(req.query.limit)) || 10;
    const offset = (page - 1) * limit;

    // Simpler query using query() instead of execute()
    const [rows] = await pool.query<ForumPostRow[]>(
      'SELECT * FROM forum_posts_raw ORDER BY added_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    // Get total count
    const [countResult] = await pool.query<TotalCountRow[]>(
      'SELECT COUNT(*) as total FROM forum_posts_raw'
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    const response: ApiResponse<ForumPost[]> = {
      data: rows,
      total,
      page,
      totalPages
    };

    res.json(response);
  } catch (error) {
    console.error("Detailed API Error:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing database pool...');
  await pool.end();
  process.exit(0);
});
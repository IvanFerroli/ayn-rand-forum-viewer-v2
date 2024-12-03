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
interface CommentRow extends RowDataPacket {
  id: number;
  body: string;
  node_type: string;
  added_at: Date;
  score: number;
  parent_id: number;  // Added this line
}

// Main posts endpoint with improved query
app.get("/api/posts", async (req: Request, res: Response) => {
  try {
    const page = parseInt(String(req.query.page)) || 1;
    const limit = parseInt(String(req.query.limit)) || 10;
    const offset = (page - 1) * limit;

    // Updated query to include node_type and filter deleted posts
    const [rows] = await pool.query<ForumPostRow[]>(
      `SELECT 
        id, 
        title, 
        tagnames, 
        body,
        node_type,
        added_at, 
        score
      FROM forum_posts_raw 
      WHERE (state_string IS NULL OR state_string != '(deleted)')
      ORDER BY added_at DESC 
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Get total count with same filters
    const [countResult] = await pool.query<TotalCountRow[]>(
      `SELECT COUNT(*) as total 
       FROM forum_posts_raw 
       WHERE (state_string IS NULL OR state_string != '(deleted)')`
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

// Updated endpoint to get comments for a specific post
app.get("/api/posts/:postId/comments", async (req: Request, res: Response) => {
  try {
    const postId = req.params.postId;
    
    // First, get the original post
    const [post] = await pool.query<ForumPostRow[]>(
      `SELECT id, title, tagnames, body, node_type, added_at, score 
       FROM forum_posts_raw 
       WHERE id = ? AND node_type = 'question'`,
      [postId]
    );

    if (!post[0]) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Get comments and answers using parent_id relationship
    const [comments] = await pool.query<CommentRow[]>(
      `SELECT 
        id,
        body,
        node_type,
        added_at,
        score,
        parent_id
      FROM forum_posts_raw
      WHERE parent_id = ?
        AND node_type IN ('comment', 'answer')
        AND (state_string IS NULL OR state_string != '(deleted)')
      ORDER BY 
        CASE node_type
          WHEN 'answer' THEN 1
          WHEN 'comment' THEN 2
          ELSE 3
        END,
        score DESC,
        added_at ASC`,
      [postId]
    );

    res.json({ 
      comments,
      post: post[0]
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
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
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
  parent_id: number;
}

// Main posts endpoint with improved query - now only returns questions with counts
app.get("/api/posts", async (req: Request, res: Response) => {
  try {
    const page = parseInt(String(req.query.page)) || 1;
    const limit = parseInt(String(req.query.limit)) || 10;
    const offset = (page - 1) * limit;

    // Updated query to correctly count answers and comments separately
    const [rows] = await pool.query<ForumPostRow[]>(
      `SELECT 
        p.id, 
        p.title, 
        p.tagnames, 
        p.body,
        p.node_type,
        p.added_at, 
        p.score,
        (
          SELECT COUNT(*) 
          FROM forum_posts_raw answers 
          WHERE answers.parent_id = p.id 
            AND answers.node_type = 'answer'
            AND (answers.state_string IS NULL OR answers.state_string != '(deleted)')
        ) as answer_count,
        (
          SELECT COUNT(*) 
          FROM forum_posts_raw comments 
          WHERE comments.parent_id = p.id 
            AND comments.node_type = 'comment'
            AND (comments.state_string IS NULL OR comments.state_string != '(deleted)')
        ) as comment_count
      FROM forum_posts_raw p
      WHERE p.node_type = 'question'
        AND (p.state_string IS NULL OR p.state_string != '(deleted)')
      GROUP BY p.id, p.title, p.tagnames, p.body, p.node_type, p.added_at, p.score
      ORDER BY p.added_at DESC 
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Get total count of questions only
    const [countResult] = await pool.query<TotalCountRow[]>(
      `SELECT COUNT(*) as total 
       FROM forum_posts_raw 
       WHERE node_type = 'question'
         AND (state_string IS NULL OR state_string != '(deleted)')`
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Ensure counts are numbers
    const formattedRows = rows.map(row => ({
      ...row,
      answer_count: Number(row.answer_count),
      comment_count: Number(row.comment_count)
    }));

    const response: ApiResponse<ForumPost[]> = {
      data: formattedRows,
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
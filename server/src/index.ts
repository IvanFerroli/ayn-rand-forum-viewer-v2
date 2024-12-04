import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db";
import { 
  ForumPost, 
  ApiResponse, 
  ForumPostRow, 
  CommentRow, 
  TotalCountRow,
  NodeType,
  SortByValue,
  QueryParams 
} from "./types";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.SERVER_PORT || 5000;

app.get("/api/posts", async (req, res) => {
  try {
    const page = parseInt(String(req.query.page)) || 1;
    const limit = parseInt(String(req.query.limit)) || 10;
    const search = String(req.query.search || '');
    const nodeType = (req.query.nodeType || 'all') as NodeType;
    const sortBy = (req.query.sortBy || 'date_desc') as SortByValue;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        p.id, 
        CASE 
          WHEN p.node_type = 'question' THEN p.title
          WHEN p.node_type IN ('answer', 'comment') THEN 
            CONCAT(
              UPPER(SUBSTRING(p.node_type, 1, 1)), LOWER(SUBSTRING(p.node_type, 2)),
              ' to: ',
              COALESCE((SELECT title FROM forum_posts_raw WHERE id = p.parent_id), 'Deleted Post')
            )
        END as title,
        p.tagnames,
        p.body,
        p.node_type,
        p.added_at,
        p.score,
        p.parent_id,
        (SELECT COUNT(*) FROM forum_posts_raw WHERE parent_id = p.id AND node_type = 'answer' AND (state_string IS NULL OR state_string != '(deleted)')) as answer_count,
        (SELECT COUNT(*) FROM forum_posts_raw WHERE parent_id = p.id AND node_type = 'comment' AND (state_string IS NULL OR state_string != '(deleted)')) as comment_count
      FROM forum_posts_raw p
      WHERE 
        (p.state_string IS NULL OR p.state_string != '(deleted)')
        AND (
          ? = 'all' OR 
          p.node_type = ?
        )
        AND (
          ? = '' OR
          LOWER(p.title) LIKE LOWER(CONCAT('%', ?, '%')) OR
          LOWER(p.body) LIKE LOWER(CONCAT('%', ?, '%')) OR
          LOWER(p.tagnames) LIKE LOWER(CONCAT('%', ?, '%'))
        )
      ORDER BY 
        CASE WHEN ? = 'date_desc' THEN p.added_at END DESC,
        CASE WHEN ? = 'date_asc' THEN p.added_at END ASC,
        CASE WHEN ? = 'score_desc' THEN p.score END DESC,
        CASE WHEN ? = 'score_asc' THEN p.score END ASC,
        CASE WHEN ? = 'interactions_desc' THEN (
          (SELECT COUNT(*) FROM forum_posts_raw WHERE parent_id = p.id AND node_type = 'answer' AND (state_string IS NULL OR state_string != '(deleted)')) +
          (SELECT COUNT(*) FROM forum_posts_raw WHERE parent_id = p.id AND node_type = 'comment' AND (state_string IS NULL OR state_string != '(deleted)'))
        ) END DESC,
        CASE WHEN ? = 'interactions_asc' THEN (
          (SELECT COUNT(*) FROM forum_posts_raw WHERE parent_id = p.id AND node_type = 'answer' AND (state_string IS NULL OR state_string != '(deleted)')) +
          (SELECT COUNT(*) FROM forum_posts_raw WHERE parent_id = p.id AND node_type = 'comment' AND (state_string IS NULL OR state_string != '(deleted)'))
        ) END ASC,
        p.added_at DESC
      LIMIT ? OFFSET ?`;

    const queryParams = [
      nodeType, nodeType,
      search, search, search, search,
      sortBy, sortBy, sortBy, sortBy, sortBy, sortBy,
      limit, offset
    ];

    const [rows] = await pool.query<ForumPostRow[]>(query, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM forum_posts_raw p
      WHERE 
        (p.state_string IS NULL OR p.state_string != '(deleted)')
        AND (
          ? = 'all' OR 
          p.node_type = ?
        )
        AND (
          ? = '' OR
          LOWER(p.title) LIKE LOWER(CONCAT('%', ?, '%')) OR
          LOWER(p.body) LIKE LOWER(CONCAT('%', ?, '%')) OR
          LOWER(p.tagnames) LIKE LOWER(CONCAT('%', ?, '%'))
        )`;

    const countParams = [
      nodeType, nodeType,
      search, search, search, search
    ];

    const [countResult] = await pool.query<TotalCountRow[]>(
      countQuery,
      countParams
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    const response: ApiResponse<ForumPost[]> = {
      data: rows.map(row => ({
        ...row,
        answer_count: Number(row.answer_count || 0),
        comment_count: Number(row.comment_count || 0)
      })),
      total,
      page,
      totalPages,
      filters: {
        search,
        nodeType,
        tags: []
      },
      sort: sortBy
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get("/api/posts/:postId/comments", async (req, res) => {
  try {
    const postId = req.params.postId;
    
    const [post] = await pool.query<ForumPostRow[]>(
      `SELECT id, title, tagnames, body, node_type, added_at, score 
       FROM forum_posts_raw 
       WHERE id = ? AND node_type = 'question'`,
      [postId]
    );

    if (!post[0]) {
      return res.status(404).json({ error: "Post not found" });
    }

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
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
  SortByValue
} from "./types";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.SERVER_PORT || 5001;

// API Routes
const router = express.Router();

// Get posts with filters and pagination
router.get("/posts", async (req, res) => {
  try {
    const page = parseInt(String(req.query.page)) || 1;
    const limit = parseInt(String(req.query.limit)) || 10;
    const search = String(req.query.search || '');
    const nodeType = (req.query.nodeType || 'all') as NodeType;
    const sortBy = (req.query.sortBy || 'date_desc') as SortByValue;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        n.id, 
        CASE 
          WHEN n.node_type = 'question' THEN n.title
          WHEN n.node_type IN ('answer', 'comment') THEN 
            CONCAT(
              UPPER(SUBSTRING(n.node_type, 1, 1)), LOWER(SUBSTRING(n.node_type, 2)),
              ' to: ',
              COALESCE((SELECT title FROM forum_node WHERE id = n.parent_id AND state_string != '(deleted)'), 'Deleted Post')
            )
        END AS title,
        n.body,
        n.node_type,
        n.added_at,
        n.score,
        n.tagnames,
        u.real_name AS author_name,
        (SELECT COUNT(*) FROM forum_node WHERE parent_id = n.id AND node_type = 'answer' AND state_string != '(deleted)') AS answer_count,
        (SELECT COUNT(*) FROM forum_node WHERE parent_id = n.id AND node_type = 'comment' AND state_string != '(deleted)') AS comment_count
      FROM forum_node n
      JOIN forum_user u ON n.author_id = u.user_ptr_id
      WHERE 
        n.state_string != '(deleted)'
        AND (n.node_type = ? OR ? = 'all')
        AND (
          ? = '' OR 
          LOWER(n.title) LIKE LOWER(CONCAT('%', ?, '%')) OR 
          LOWER(n.body) LIKE LOWER(CONCAT('%', ?, '%')) OR
          LOWER(n.tagnames) LIKE LOWER(CONCAT('%', ?, '%'))
        )
      ORDER BY 
        CASE WHEN ? = 'date_desc' THEN n.added_at END DESC,
        CASE WHEN ? = 'date_asc' THEN n.added_at END ASC,
        CASE WHEN ? = 'score_desc' THEN n.score END DESC,
        CASE WHEN ? = 'score_asc' THEN n.score END ASC,
        CASE WHEN ? = 'interactions_desc' THEN (
          (SELECT COUNT(*) FROM forum_node WHERE parent_id = n.id AND node_type = 'answer' AND state_string != '(deleted)') +
          (SELECT COUNT(*) FROM forum_node WHERE parent_id = n.id AND node_type = 'comment' AND state_string != '(deleted)')
        ) END DESC,
        CASE WHEN ? = 'interactions_asc' THEN (
          (SELECT COUNT(*) FROM forum_node WHERE parent_id = n.id AND node_type = 'answer' AND state_string != '(deleted)') +
          (SELECT COUNT(*) FROM forum_node WHERE parent_id = n.id AND node_type = 'comment' AND state_string != '(deleted)')
        ) END ASC
      LIMIT ? OFFSET ?`;

    const queryParams = [
      nodeType, nodeType,
      search, search, search, search,
      sortBy, sortBy, sortBy, sortBy, sortBy, sortBy,
      limit, offset
    ];

    const [rows] = await pool.query<ForumPostRow[]>(query, queryParams);

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM forum_node n
      WHERE 
        n.state_string != '(deleted)'
        AND (n.node_type = ? OR ? = 'all')
        AND (
          ? = '' OR 
          LOWER(n.title) LIKE LOWER(CONCAT('%', ?, '%')) OR 
          LOWER(n.body) LIKE LOWER(CONCAT('%', ?, '%')) OR
          LOWER(n.tagnames) LIKE LOWER(CONCAT('%', ?, '%'))
        )
    `;
    const countParams = [nodeType, nodeType, search, search, search, search];
    const [countResult] = await pool.query<TotalCountRow[]>(countQuery, countParams);

    const total = countResult[0]?.total || 0;
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
      filters: { search, nodeType, tags: [] },
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

// Get comments for a specific post
router.get("/posts/:postId/comments", async (req, res) => {
  try {
    const postId = req.params.postId;
    
    const [post] = await pool.query<ForumPostRow[]>(`
      SELECT 
        n.id, 
        n.title, 
        n.tagnames, 
        n.body, 
        n.node_type, 
        n.added_at, 
        n.score,
        u.real_name AS author_name
      FROM forum_node n
      JOIN forum_user u ON n.author_id = u.user_ptr_id
      WHERE n.id = ? 
        AND n.node_type = 'question'
        AND n.state_string != '(deleted)'`, 
      [postId]
    );

    if (!post[0]) {
      return res.status(404).json({ error: "Post not found" });
    }

    const [comments] = await pool.query<CommentRow[]>(`
      SELECT 
        n.id, 
        n.body, 
        n.node_type, 
        n.added_at, 
        n.score, 
        n.parent_id,
        u.real_name AS author_name
      FROM forum_node n
      JOIN forum_user u ON n.author_id = u.user_ptr_id
      WHERE n.parent_id = ? 
        AND n.node_type IN ('comment', 'answer')
        AND n.state_string != '(deleted)'
      ORDER BY 
        CASE n.node_type 
          WHEN 'answer' THEN 1 
          WHEN 'comment' THEN 2 
          ELSE 3 
        END,
        n.score DESC,
        n.added_at ASC`, 
      [postId]
    );

    return res.json({ 
      comments,
      post: post[0]
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Use /api prefix for all routes
app.use("/api", router);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing database pool...');
  await pool.end();
  process.exit(0);
});

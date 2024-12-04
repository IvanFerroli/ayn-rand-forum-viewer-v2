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

// Helper function with proper typing
const buildQueryClauses = (
  search: string,
  nodeType: NodeType,
  sortBy: SortByValue
): { whereClause: string; orderByClause: string; params: any[] } => {
  const params: any[] = [];
  let whereClause = 'WHERE (p.state_string IS NULL OR p.state_string != "(deleted)")';
  
  if (nodeType && nodeType !== 'all') {
    whereClause += ' AND p.node_type = ?';
    params.push(nodeType);
  } else {
    whereClause += ' AND p.node_type = "question"';
  }

  if (search) {
    whereClause += ` AND (
      p.title LIKE ? OR 
      p.body LIKE ? OR 
      p.tagnames LIKE ?
    )`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  let orderByClause = '';
  switch (sortBy) {
    case 'date_asc':
      orderByClause = 'ORDER BY p.added_at ASC';
      break;
    case 'interactions_desc':
      orderByClause = 'ORDER BY (answer_count + comment_count) DESC, p.added_at DESC';
      break;
    case 'interactions_asc':
      orderByClause = 'ORDER BY (answer_count + comment_count) ASC, p.added_at DESC';
      break;
    case 'score_desc':
      orderByClause = 'ORDER BY p.score DESC, p.added_at DESC';
      break;
    case 'score_asc':
      orderByClause = 'ORDER BY p.score ASC, p.added_at DESC';
      break;
    default:
      orderByClause = 'ORDER BY p.added_at DESC';
  }

  return { whereClause, orderByClause, params };
};

app.get("/api/posts", async (req, res) => {
  try {
    const page = parseInt(String(req.query.page)) || 1;
    const limit = parseInt(String(req.query.limit)) || 10;
    const search = String(req.query.search || '');
    const nodeType = (req.query.nodeType || 'all') as NodeType;
    const sortBy = (req.query.sortBy || 'date_desc') as SortByValue;
    const offset = (page - 1) * limit;

    const { whereClause, orderByClause, params } = buildQueryClauses(
      search,
      nodeType,
      sortBy
    );

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
      ${whereClause}
      GROUP BY p.id, p.title, p.tagnames, p.body, p.node_type, p.added_at, p.score
      ${orderByClause}
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult] = await pool.query<TotalCountRow[]>(
      `SELECT COUNT(*) as total 
       FROM forum_posts_raw p
       ${whereClause}`,
      params
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    const formattedRows = rows.map(row => ({
      ...row,
      answer_count: Number(row.answer_count),
      comment_count: Number(row.comment_count)
    }));

    const response: ApiResponse<ForumPost[]> = {
      data: formattedRows,
      total,
      page,
      totalPages,
      filters: {
        search,
        nodeType: nodeType || 'all',
        tags: []
      },
      sort: sortBy
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
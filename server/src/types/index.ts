import { RowDataPacket } from 'mysql2';

export type NodeType = 'all' | 'question' | 'answer' | 'comment';
export type SortByValue = 
  | 'date_desc' 
  | 'date_asc' 
  | 'interactions_desc' 
  | 'interactions_asc' 
  | 'score_desc' 
  | 'score_asc';

// Base interface for forum posts
export interface BaseForumPost {
  id: number;
  title: string;
  tagnames: string;
  body: string;
  node_type: NodeType;
  added_at: Date;
  score: number;
  parent_id: number | null;
  answer_count: number;
  comment_count: number;
}

// Extended interface for API responses
export interface ForumPost extends BaseForumPost {
  parent_title?: string | null;
}

// Database row interface
export interface ForumPostRow extends BaseForumPost, RowDataPacket {
  parent_title: string | null;
  answer_count: string | number;
  comment_count: string | number;
}

export interface Comment {
  id: number;
  body: string;
  added_at: Date;
  score: number;
  parent_id: number;
}

export interface CommentRow extends Comment, RowDataPacket {}

export interface TotalCountRow extends RowDataPacket {
  total: number;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  nodeType?: NodeType;
  sortBy?: SortByValue;
}

export interface ApiResponse<T> {
  data: T;
  total: number;
  page: number;
  totalPages: number;
  filters: {
    search: string;
    nodeType: NodeType;
    tags: string[];
  };
  sort: SortByValue;
}

export interface CommentsResponse {
  comments: Comment[];
  post: ForumPost;
}
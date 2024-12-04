export interface ForumPost {
  id: number;
  title: string;
  tagnames: string;
  body: string;
  node_type: string;
  added_at: string | Date; // Keep string | Date for frontend flexibility
  score: number;
  parent_id?: number;
  state_string?: string;
  answer_count: number;  // Changed from optional to required
  comment_count: number; // Changed from optional to required
}

export interface Comment {
  id: number;
  body: string;
  node_type: string;
  added_at: string | Date;
  score: number;
  parent_id: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  node_type?: string;
}

export interface ApiResponse<T> {
  data: T;
  total: number;
  page: number;
  totalPages: number;
}

export interface CommentsResponse {
  comments: Comment[];
  post: ForumPost;  // Added to match backend response
}
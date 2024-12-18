export interface ForumPost {
  id: number;
  title: string;
  body: string;
  node_type: string;
  added_at: Date;
  score: number;
  parent_id: number | null;
  answer_count: number;
  comment_count: number;
  tagnames?: string; // Adiciona a propriedade opcional 'tagnames'
  author_name?: string; // Adiciona a propriedade opcional 'author_name'
}


export interface Comment {
  id: number;
  body: string;
  added_at: Date;
  score: number;
  parent_id: number;
  node_type: string;
  author_name?: string; // Adiciona a propriedade opcional 'author_name'
  user_id?: number;
}


// Updated to include all possible filter options
export interface FilterOptions {
  search: string;
  nodeType: 'all' | 'question' | 'answer' | 'comment';
  tags: string[];
}

// Define available sort options
export interface SortOption {
  label: string;
  value: SortValue;
}

// Type for sort values
export type SortValue = 
  | 'date_desc' 
  | 'date_asc' 
  | 'score_desc' 
  | 'score_asc'
  | 'interactions_desc'
  | 'interactions_asc';

// Updated pagination params to include new filter and sort options
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  node_type?: string;
  sortBy?: SortValue;
}

export interface ApiResponse<T> {
  data: T;
  total: number;
  page: number;
  totalPages: number;
  filters?: FilterOptions;
  sort?: SortValue;
}

export interface CommentsResponse {
  comments: Comment[];
  post: ForumPost;
}

// New interface for managing filter state in components
export interface FilterState {
  search: string;
  nodeType: 'all' | 'question' | 'answer' | 'comment';
  sortBy: SortValue;
  tags: string[];
}

export type NodeType = 'all' | 'question' | 'answer' | 'comment';

// Constants for the UI
export const SORT_OPTIONS: SortOption[] = [
  { label: 'Newest First', value: 'date_desc' },
  { label: 'Oldest First', value: 'date_asc' },
  { label: 'Most Interactions', value: 'interactions_desc' },
  { label: 'Least Interactions', value: 'interactions_asc' },
  { label: 'Highest Score', value: 'score_desc' },
  { label: 'Lowest Score', value: 'score_asc' },
];

export const NODE_TYPES = {
  ALL: 'all',
  QUESTION: 'question',
  ANSWER: 'answer',
  COMMENT: 'comment',
} as const;
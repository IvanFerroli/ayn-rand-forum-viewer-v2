import { RowDataPacket } from 'mysql2';

export type NodeType = 'all' | 'question' | 'answer' | 'comment';
export type SortByValue = 'date_desc' | 'date_asc' | 'interactions_desc' | 'interactions_asc' | 'score_desc' | 'score_asc';

export interface ForumPost {
    id: number;
    title: string;
    tagnames: string;
    body: string;
    node_type: string;
    added_at: Date;
    score: number;
    parent_id?: number;
    state_string?: string;
    answer_count: number;
    comment_count: number;
}

export interface Comment {
    id: number;
    body: string;
    node_type: string;
    added_at: Date;
    score: number;
    parent_id: number;
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
    filters?: {
        search: string;
        nodeType: NodeType;
        tags: string[];
    };
    sort?: SortByValue;
}

export interface CommentsResponse {
    comments: Comment[];
    post: ForumPost;
}

// Database specific interfaces
export interface ForumPostRow extends ForumPost, RowDataPacket {}
export interface CommentRow extends Comment, RowDataPacket {}
export interface TotalCountRow extends RowDataPacket {
    total: number;
}
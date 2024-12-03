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
}

export interface Comment {
    id: number;
    body: string;
    node_type: string;
    added_at: Date;
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

// Use generic type consistently
export interface ApiResponse<T> {
    data: T;
    total: number;
    page: number;
    totalPages: number;
}

export interface CommentsResponse {
    comments: Comment[];
}
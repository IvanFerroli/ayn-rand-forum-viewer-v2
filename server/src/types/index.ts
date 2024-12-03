export interface ForumPost {
    id: number;
    title: string;
    tagnames: string;
    body: string;
    node_type: string;
    added_at: Date;
    score: number;
  }
  
  export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
    tag?: string;
  }
  
  export interface ApiResponse<T> {
    data: T;
    total: number;
    page: number;
    totalPages: number;
  }
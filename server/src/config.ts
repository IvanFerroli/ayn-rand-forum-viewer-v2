// Base URL for API requests
export const API_BASE_URL = '/old-oa/api';

// API endpoints
export const API_ENDPOINTS = {
    POSTS: `${API_BASE_URL}/posts`,
    COMMENTS: (postId: number) => `${API_BASE_URL}/posts/${postId}/comments`
};
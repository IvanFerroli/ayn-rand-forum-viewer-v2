// API configuration
export const API_CONFIG = {
    // Development environment
    development: {
      baseUrl: 'http://127.0.0.1:5001'
    },
    // Production environment
    production: {
      baseUrl: '/old-oa'
    }
  };
  
const isDevelopment = process.env.NODE_ENV === 'development';

export const BASE_URL = isDevelopment 
    ? 'http://localhost:5001/api'
    : '/old-oa';
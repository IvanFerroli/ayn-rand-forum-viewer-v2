import React, { useEffect, useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Typography,
  CircularProgress,
  Pagination,
  Box,
  Chip
} from '@mui/material';
import { ForumPost } from '../types';

interface ApiResponse {
  data: ForumPost[];
  total: number;
  page: number;
  totalPages: number;
}

export const Posts: React.FC = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPosts = async (pageNumber: number) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/posts?page=${pageNumber}&limit=10`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      console.log("Received data:", data);
      setPosts(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
      <CircularProgress />
    </Box>
  );
  
  if (error) return (
    <Typography color="error" align="center">
      Error: {error}
    </Typography>
  );
  
  if (!posts.length) return (
    <Typography align="center">
      No posts found
    </Typography>
  );

  return (
    <Box sx={{ maxWidth: '100%', margin: '0 auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom align="center">
        Ayn Rand Forum Posts
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tags</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id} hover>
                <TableCell sx={{ maxWidth: 300 }}>
                  {post.title || 'Untitled'}
                </TableCell>
                <TableCell>
                  {post.tagnames ? post.tagnames.split(' ').map((tag, i) => (
                    <Chip 
                      key={i} 
                      label={tag} 
                      size="small" 
                      sx={{ m: 0.5 }} 
                      variant="outlined"
                    />
                  )) : '-'}
                </TableCell>
                <TableCell>
                  {post.added_at ? 
                    new Date(post.added_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'No date'
                  }
                </TableCell>
                <TableCell align="right">
                  {post.score || 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
        <Pagination 
          count={totalPages} 
          page={page} 
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
    </Box>
  );
};
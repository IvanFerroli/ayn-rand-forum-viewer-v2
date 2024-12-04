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
  Chip,
  IconButton,
  Collapse,
  Badge
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { ForumPost, Comment, ApiResponse, CommentsResponse } from '../types';

interface RowProps {
  post: ForumPost;
}

const Row: React.FC<RowProps> = ({ post }) => {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    if (!open) {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/posts/${post.id}/comments`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: CommentsResponse = await response.json();
        setComments(data.comments);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoading(false);
      }
    }
    setOpen(!open);
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }} hover>
        <TableCell>
          <Badge 
            badgeContent={(post.answer_count || 0) + (post.comment_count || 0)} 
            color="primary"
            sx={{ '& .MuiBadge-badge': { right: -3, top: 13 } }}
          >
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={fetchComments}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </Badge>
        </TableCell>
        <TableCell sx={{ maxWidth: 300 }}>
          <Typography variant="body1">
            {post.title || 'Untitled'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {post.answer_count || 0} answers • {post.comment_count || 0} comments
          </Typography>
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
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Discussion Thread
              </Typography>
              {loading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : comments.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Content</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {comments.map((comment) => (
                      <TableRow 
                        key={comment.id} 
                        hover
                        sx={{
                          backgroundColor: comment.node_type === 'answer' ? 'action.hover' : 'inherit'
                        }}
                      >
                        <TableCell sx={{ maxWidth: 400 }}>
                          <Typography variant="body2">
                            {comment.body}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={comment.node_type}
                            size="small"
                            color={comment.node_type === 'answer' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(comment.added_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell align="right">{comment.score}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  No responses yet
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

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
      const data: ApiResponse<ForumPost[]> = await response.json();
      console.log('Received posts data:', data.data); // Add this line
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
              <TableCell width={50} /> {/* Column for expand button */}
              <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tags</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.map((post) => (
              <Row key={post.id} post={post} />
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
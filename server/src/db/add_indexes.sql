-- Drop existing indexes to avoid conflicts
DROP INDEX IF EXISTS idx_node_type ON forum_posts_raw;
DROP INDEX IF EXISTS idx_parent_id ON forum_posts_raw;
DROP INDEX IF EXISTS idx_added_at ON forum_posts_raw;
DROP INDEX IF EXISTS idx_score ON forum_posts_raw;
DROP INDEX IF EXISTS idx_title_body ON forum_posts_raw;
DROP INDEX IF EXISTS idx_state_string ON forum_posts_raw;
DROP INDEX IF EXISTS idx_parent_title ON forum_posts_raw;

-- Create optimized indexes
CREATE INDEX idx_node_type_state ON forum_posts_raw(node_type, state_string);
CREATE INDEX idx_parent_id_type ON forum_posts_raw(parent_id, node_type);
CREATE INDEX idx_added_at ON forum_posts_raw(added_at);
CREATE INDEX idx_score ON forum_posts_raw(score);

-- Add indexes for better query performance
ALTER TABLE forum_posts_raw ADD FULLTEXT INDEX ft_title (title);
ALTER TABLE forum_posts_raw ADD FULLTEXT INDEX ft_body (body);
ALTER TABLE forum_posts_raw ADD FULLTEXT INDEX ft_tagnames (tagnames);

-- Add indexes for sorting and filtering
ALTER TABLE forum_posts_raw ADD INDEX idx_node_type (node_type);
ALTER TABLE forum_posts_raw ADD INDEX idx_added_at (added_at);
ALTER TABLE forum_posts_raw ADD INDEX idx_score (score);
ALTER TABLE forum_posts_raw ADD INDEX idx_parent_id (parent_id);
ALTER TABLE forum_posts_raw ADD INDEX idx_state_string (state_string);
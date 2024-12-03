export interface ForumPost {
  id: number;
  title: string;
  tagnames: string;
  body: string;
  node_type: string;
  added_at: string | Date;
  score: number;
}
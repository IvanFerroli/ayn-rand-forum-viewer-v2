import { RowDataPacket } from 'mysql2';

// Tipos para os valores de NodeType e ordenação
export type NodeType = 'all' | 'question' | 'answer' | 'comment';
export type SortByValue = 
  | 'date_desc' 
  | 'date_asc' 
  | 'interactions_desc' 
  | 'interactions_asc' 
  | 'score_desc' 
  | 'score_asc';

// Base interface para os posts
export interface BaseForumPost {
  id: number;
  title: string;
  tagnames: string;
  body: string;
  node_type: NodeType;
  added_at: Date;
  score: number;
  parent_id: number | null;
  answer_count: number;
  comment_count: number;
}

// Interface estendida para respostas da API
export interface ForumPost extends BaseForumPost {
  parent_title?: string | null;
  author_name?: string; // Novo campo para o nome do autor
}

// Interface que representa os dados retornados pelo banco de dados
export interface ForumPostRow extends RowDataPacket {
  id: number;
  title: string;
  tagnames: string;
  body: string;
  node_type: NodeType;
  added_at: Date;
  score: number;
  parent_id: number | null;
  answer_count: number; // Tipagem ajustada (convertida no backend)
  comment_count: number; // Tipagem ajustada (convertida no backend)
  parent_title: string | null;
  author_name: string; // Nome do autor vindo do JOIN com forum_user
}

// Interface para comentários
export interface Comment {
  id: number;
  body: string;
  added_at: Date;
  score: number;
  parent_id: number;
  node_type: string;
  author_name?: string;
  user_id?: number; // Adiciona a propriedade opcional 'author_name'
}

// Interface para as linhas retornadas de comentários no banco de dados
export interface CommentRow extends RowDataPacket {
  id: number;
  body: string;
  added_at: Date;
  score: number;
  parent_id: number;
  node_type: NodeType;
  author_name: string; // Nome do autor vindo do JOIN
}

// Interface para contagem total (pagination)
export interface TotalCountRow extends RowDataPacket {
  total: number;
}

// Interface para os parâmetros de busca e filtros
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  nodeType?: NodeType;
  sortBy?: SortByValue;
}

// Interface para respostas da API
export interface ApiResponse<T> {
  data: T;
  total: number;
  page: number;
  totalPages: number;
  filters: {
    search: string;
    nodeType: NodeType;
    tags: string[]; // Mantido conforme esperado
  };
  sort: SortByValue;
}

// Interface para resposta de comentários
export interface CommentsResponse {
  comments: Comment[];
  post: ForumPost;
}

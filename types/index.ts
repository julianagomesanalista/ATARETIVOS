// ─── Enums / Scalars ──────────────────────────────────────────────────────────
export type Role = 'admin' | 'master' | 'user';
export type Status = 'todo' | 'doing' | 'done';
export type Complexity = 'facil' | 'medio' | 'dificil';

// ─── Entities ─────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  google_id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: Role;
  created_at: string;
}

export interface Tag {
  name: string;
  color: string; // Tailwind bg-* class
}

export interface Attachment {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  user?: User;
  content: string;
  is_edited: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  complexity: Complexity;
  creator_id: string;
  creator?: User;
  assigned_to?: string;
  assignee?: User;
  company_name?: string;
  created_at: string;
  due_date: string;
  tags: Tag[];
  comments: Comment[];
  attachments: Attachment[];
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender?: User;
  message: string;
  task_mention_id?: string;
  created_at: string;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
export interface KanbanColumn {
  id: Status;
  title: string;
  headerColor: string;
  tasks: Task[];
}

// ─── Enums / Scalars ──────────────────────────────────────────────────────────
export type Role = 'admin' | 'master' | 'gestor' | 'user';
export type Status = 'todo' | 'doing' | 'done';
export type Complexity = 'facil' | 'medio' | 'dificil';
export type Area = 'Comercial' | 'Tecnologia' | 'Jurídico' | 'Hunters' | 'Marketing';

// ─── Entities ─────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  google_id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  background_url?: string;
  role: Role;
  area?: Area;
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
  receiver_id?: string; // Optional for global messages, used for DMs
  message: string;
  task_mention_id?: string;
  created_at: string;
}

export interface ChatTabState {
  id: string; // 'global' or the receiver_id
  type: 'global' | 'dm';
  chatName: string;
  draft: string;
  draftMention?: { taskId: string; title: string };
  isOpen: boolean;
  isMinimized: boolean;
  lastReadAt?: string; // ISO timestamp of when the tab was last opened/focused
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
export interface KanbanColumn {
  id: Status;
  title: string;
  headerColor: string;
  tasks: Task[];
}

// ─── Ideas & Notifications ────────────────────────────────────────────────────
export interface Idea {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  created_at: string;
  creator?: User; // expanded relation
}

export interface IdeaComment {
  id: string;
  idea_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User; // expanded relation
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link_type?: string;
  read: boolean;
  created_at: string;
}

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { Task, Status, Comment, ChatMessage, KanbanColumn } from '@/types';
import { mockTasks, mockChatMessages, findUser } from '@/data/mockData';
import { calculateDueDate, isOverdue } from '@/utils/sla';
import { useAuth } from './AuthContext';

interface KanbanContextType {
  tasks: Task[];
  columns: KanbanColumn[];
  chatMessages: ChatMessage[];
  selectedTask: Task | null;
  showCreateModal: boolean;
  showChat: boolean;
  overdueTasks: Task[];
  setSelectedTask: (task: Task | null) => void;
  setShowCreateModal: (v: boolean) => void;
  setShowChat: (v: boolean) => void;
  moveTask: (taskId: string, newStatus: Status) => void;
  createTask: (data: Omit<Task, 'id' | 'created_at' | 'due_date' | 'comments' | 'attachments'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addComment: (taskId: string, content: string) => void;
  editComment: (commentId: string, content: string) => void;
  deleteComment: (commentId: string) => void;
  sendChatMessage: (message: string) => void;
  getTaskById: (id: string) => Task | undefined;
}

const KanbanContext = createContext<KanbanContextType | null>(null);

const COLUMN_DEFS: { id: Status; title: string; headerColor: string }[] = [
  { id: 'todo', title: 'A Fazer', headerColor: '#EF4444' },
  { id: 'doing', title: 'Fazendo', headerColor: '#FBBF24' },
  { id: 'done', title: 'Feito', headerColor: '#22C55E' },
];

export function KanbanProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const { currentUser } = useAuth();

  // Build column view from tasks
  const columns: KanbanColumn[] = useMemo(
    () =>
      COLUMN_DEFS.map((def) => ({
        ...def,
        tasks: tasks.filter((t) => t.status === def.id),
      })),
    [tasks]
  );

  const overdueTasks = useMemo(() => tasks.filter(isOverdue), [tasks]);

  const getTaskById = useCallback(
    (id: string) => tasks.find((t) => t.id === id),
    [tasks]
  );

  const moveTask = useCallback((taskId: string, newStatus: Status) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  }, []);

  const createTask = useCallback(
    (data: Omit<Task, 'id' | 'created_at' | 'due_date' | 'comments' | 'attachments'>) => {
      const now = new Date().toISOString();
      const due = calculateDueDate(now, data.complexity).toISOString();
      const newTask: Task = {
        ...data,
        id: `task-${uuidv4()}`,
        created_at: now,
        due_date: due,
        comments: [],
        attachments: [],
        creator: currentUser ?? undefined,
      };
      setTasks((prev) => [newTask, ...prev]);
      toast.success('Tarefa criada com sucesso!');
    },
    [currentUser]
  );

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
    setSelectedTask((prev) => (prev?.id === taskId ? { ...prev, ...updates } : prev));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
    toast.success('Tarefa excluída.');
  }, []);

  const addComment = useCallback(
    (taskId: string, content: string) => {
      if (!currentUser) return;
      const comment: Comment = {
        id: `comment-${uuidv4()}`,
        task_id: taskId,
        user_id: currentUser.id,
        user: currentUser,
        content,
        is_edited: false,
        created_at: new Date().toISOString(),
      };
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, comments: [...t.comments, comment] } : t
        )
      );
      setSelectedTask((prev) =>
        prev?.id === taskId ? { ...prev, comments: [...prev.comments, comment] } : prev
      );
    },
    [currentUser]
  );

  const editComment = useCallback((commentId: string, content: string) => {
    const patchComments = (comments: Comment[]) =>
      comments.map((c) =>
        c.id === commentId ? { ...c, content, is_edited: true } : c
      );
    setTasks((prev) =>
      prev.map((t) => ({ ...t, comments: patchComments(t.comments) }))
    );
    setSelectedTask((prev) =>
      prev ? { ...prev, comments: patchComments(prev.comments) } : prev
    );
  }, []);

  const deleteComment = useCallback((commentId: string) => {
    const filterComments = (comments: Comment[]) =>
      comments.filter((c) => c.id !== commentId);
    setTasks((prev) =>
      prev.map((t) => ({ ...t, comments: filterComments(t.comments) }))
    );
    setSelectedTask((prev) =>
      prev ? { ...prev, comments: filterComments(prev.comments) } : prev
    );
  }, []);

  const sendChatMessage = useCallback(
    (message: string) => {
      if (!currentUser) return;
      // Detect #task-id mentions
      const mentionMatch = message.match(/#(task-[a-zA-Z0-9-]+)/);
      const msg: ChatMessage = {
        id: `msg-${uuidv4()}`,
        sender_id: currentUser.id,
        sender: currentUser,
        message,
        task_mention_id: mentionMatch ? mentionMatch[1] : undefined,
        created_at: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, msg]);
    },
    [currentUser]
  );

  return (
    <KanbanContext.Provider
      value={{
        tasks,
        columns,
        chatMessages,
        selectedTask,
        showCreateModal,
        showChat,
        overdueTasks,
        setSelectedTask,
        setShowCreateModal,
        setShowChat,
        moveTask,
        createTask,
        updateTask,
        deleteTask,
        addComment,
        editComment,
        deleteComment,
        sendChatMessage,
        getTaskById,
      }}
    >
      {children}
    </KanbanContext.Provider>
  );
}

export function useKanban(): KanbanContextType {
  const ctx = useContext(KanbanContext);
  if (!ctx) throw new Error('useKanban must be used inside <KanbanProvider>');
  return ctx;
}

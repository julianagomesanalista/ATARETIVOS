"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Task, Status, Comment, ChatMessage, KanbanColumn, ChatTabState } from '@/types';
import { calculateDueDate, isOverdue } from '@/utils/sla';
import { useAuth } from './AuthContext';
import { createClient } from '@/utils/supabase/client';

interface KanbanContextType {
  tasks: Task[];
  columns: KanbanColumn[];
  chatMessages: ChatMessage[];
  selectedTask: Task | null;
  showCreateModal: boolean;
  chatTabs: ChatTabState[];
  overdueTasks: Task[];
  setSelectedTask: (task: Task | null) => void;
  setShowCreateModal: (v: boolean) => void;
  openChatTab: (tabId: string, type: 'global' | 'dm', chatName: string) => void;
  closeChatTab: (tabId: string) => void;
  minimizeChatTab: (tabId: string, minimized: boolean) => void;
  setChatDraft: (tabId: string, draft: string) => void;
  setChatMention: (tabId: string, mention?: { taskId: string; title: string }) => void;
  moveTask: (taskId: string, newStatus: Status) => void;
  createTask: (data: Omit<Task, 'id' | 'created_at' | 'due_date' | 'comments' | 'attachments'> & { created_at?: string; due_date?: string }) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addComment: (taskId: string, content: string) => void;
  editComment: (commentId: string, content: string) => void;
  deleteComment: (commentId: string) => void;
  sendChatMessage: (message: string, receiverId?: string) => void;
  getTaskById: (id: string) => Task | undefined;
}

const KanbanContext = createContext<KanbanContextType | null>(null);

const COLUMN_DEFS: { id: Status; title: string; headerColor: string }[] = [
  { id: 'todo', title: 'A Fazer', headerColor: '#EF4444' },
  { id: 'doing', title: 'Fazendo', headerColor: '#FBBF24' },
  { id: 'done', title: 'Feito', headerColor: '#22C55E' },
];

export function KanbanProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { currentUser, availableUsers } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [chatTabs, setChatTabs] = useState<ChatTabState[]>(() => {
    // Restore lastReadAt from localStorage (persisted across reloads)
    const stored = typeof window !== 'undefined' ? localStorage.getItem('kanban_chat_read') : null;
    const readMap: Record<string, string> = stored ? JSON.parse(stored) : {};
    return [
      { id: 'global', type: 'global', chatName: 'Chat da Equipe', draft: '', isOpen: false, isMinimized: false, lastReadAt: readMap['global'] }
    ];
  });

  // Busca inicial dos dados
  const fetchData = useCallback(async () => {
    // Regras de visibilidade:
    //   - 'user'   -> apenas suas próprias tarefas
    //   - 'gestor' -> tarefas de usuários do mesmo setor (area)
    //   - 'master' / 'admin' -> todas as tarefas
    const tasksQuery = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (currentUser?.role === 'user') {
      tasksQuery.eq('creator_id', currentUser.id);
    }

    const { data: tasksData } = await tasksQuery;

    // Buscar comentarios
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true });

    // Buscar mensagens
    const { data: messagesData } = await supabase
      .from('chat_messages')
      .select('*')
      .order('timestamp', { ascending: true });

    if (tasksData) {
      // Montar tasks com creator e comments com user
      let builtTasks = tasksData.map(t => {
        const creator = availableUsers.find(u => u.id === t.creator_id);
        const taskComments = (commentsData || [])
          .filter(c => c.task_id === t.id)
          .map(c => ({
            ...c,
            user: availableUsers.find(u => u.id === c.user_id)
          }));
        
        return {
          ...t,
          creator,
          comments: taskComments,
          attachments: [] // Simplificando por enquanto
        };
      });

      // Filtro de visibilidade p/ gestor: apenas tarefas do mesmo setor
      if (currentUser?.role === 'gestor' && currentUser.area) {
        builtTasks = builtTasks.filter(t => {
          const creatorUser = availableUsers.find(u => u.id === t.creator_id);
          // Gestor vê as próprias tarefas + tarefas de usuários do mesmo setor
          return t.creator_id === currentUser.id || creatorUser?.area === currentUser.area;
        });
      }

      setTasks(builtTasks as Task[]);
    }

    if (messagesData) {
      const builtMessages: ChatMessage[] = messagesData.map(m => ({
        id: m.id,
        sender_id: m.sender_id,
        receiver_id: m.receiver_id,
        message: m.content,
        created_at: m.timestamp,
        sender: availableUsers.find(u => u.id === m.sender_id)
      }));
      setChatMessages(builtMessages);
    }
  }, [supabase, availableUsers, currentUser]);

  useEffect(() => {
    // Só buscar tarefas e mensagens quando a lista de usuários estiver pronta
    if (availableUsers.length > 0) {
      fetchData();
    }
  }, [availableUsers, fetchData]);

  // Tempo real - Ouvindo mudanças no Supabase
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchData]);

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

  const openChatTab = useCallback((tabId: string, type: 'global' | 'dm', chatName: string) => {
    const now = new Date().toISOString();
    
    // Persist lastReadAt to localStorage so it survives page reloads
    try {
      const stored = localStorage.getItem('kanban_chat_read');
      const readMap: Record<string, string> = stored ? JSON.parse(stored) : {};
      readMap[tabId] = now;
      localStorage.setItem('kanban_chat_read', JSON.stringify(readMap));
    } catch (e) { /* ignore */ }

    setChatTabs((prev) => {
      const existing = prev.find((t) => t.id === tabId);
      if (existing) {
        return prev.map((t) => (t.id === tabId ? { ...t, isOpen: true, isMinimized: false, lastReadAt: now } : t));
      }
      // Restore possible persisted lastReadAt for new DM tabs too
      const stored = typeof window !== 'undefined' ? localStorage.getItem('kanban_chat_read') : null;
      const readMap: Record<string, string> = stored ? JSON.parse(stored) : {};
      return [...prev, { id: tabId, type, chatName, draft: '', isOpen: true, isMinimized: false, lastReadAt: readMap[tabId] || now }];
    });
  }, []);

  const closeChatTab = useCallback((tabId: string) => {
    setChatTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, isOpen: false } : t)));
  }, []);

  const minimizeChatTab = useCallback((tabId: string, isMinimized: boolean) => {
    setChatTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, isMinimized } : t)));
  }, []);

  const setChatDraft = useCallback((tabId: string, draft: string) => {
    setChatTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, draft } : t)));
  }, []);

  const setChatMention = useCallback((tabId: string, mention?: { taskId: string; title: string }) => {
    setChatTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, draftMention: mention } : t)));
  }, []);

  const moveTask = useCallback(async (taskId: string, newStatus: Status) => {
    // Atualização Otimista
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (error) {
      toast.error('Erro ao mover tarefa.');
      fetchData(); // reverter
    }
  }, [supabase, fetchData]);

  const createTask = useCallback(async (data: Omit<Task, 'id' | 'created_at' | 'due_date' | 'comments' | 'attachments'> & { created_at?: string; due_date?: string }) => {
      if (!currentUser) return;
      const now = data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString();
      const due = data.due_date ? new Date(data.due_date).toISOString() : calculateDueDate(now, data.complexity).toISOString();
      
      const { error } = await supabase.from('tasks').insert({
        title: data.title,
        description: data.description,
        status: data.status,
        complexity: data.complexity,
        company_name: data.company_name,
        created_at: now,
        due_date: due,
        tags: data.tags,
        creator_id: currentUser.id
      });
      
      if (error) {
        console.error("Erro no Supabase ao criar tarefa:", error);
        toast.error('Erro ao criar tarefa');
      } else {
        toast.success('Tarefa criada com sucesso!');
        fetchData();
      }
    },
    [currentUser, supabase, fetchData]
  );

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    // Atualização otimista
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
    setSelectedTask((prev) => (prev?.id === taskId ? { ...prev, ...updates } : prev));
    
    // Filtro para não enviar dados pesados aninhados pro update
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.comments;
    delete safeUpdates.creator;
    delete safeUpdates.attachments;

    const { error } = await supabase.from('tasks').update(safeUpdates).eq('id', taskId);
    if (error) {
      toast.error('Erro ao atualizar tarefa.');
      fetchData(); // reverte em caso de erro
    }
  }, [supabase, fetchData]);

  const deleteTask = useCallback(async (taskId: string) => {
    // Otimista
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);

    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      toast.error('Erro ao excluir tarefa.');
      fetchData();
    } else {
      toast.success('Tarefa excluída.');
    }
  }, [supabase, fetchData]);

  const addComment = useCallback(async (taskId: string, content: string) => {
      if (!currentUser) return;
      const { error } = await supabase.from('comments').insert({
        task_id: taskId,
        user_id: currentUser.id,
        content: content
      });
      if (error) toast.error('Erro ao enviar comentário');
    },
    [currentUser, supabase]
  );

  const editComment = useCallback(async (commentId: string, content: string) => {
    const { error } = await supabase.from('comments').update({ content, is_edited: true }).eq('id', commentId);
    if (error) toast.error('Erro ao editar comentário');
  }, [supabase]);

  const deleteComment = useCallback(async (commentId: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) toast.error('Erro ao apagar comentário');
  }, [supabase]);

  const sendChatMessage = useCallback(async (message: string, receiverId?: string) => {
      if (!currentUser) return;
      
      const tempId = `temp-${Date.now()}`;
      const tempMsg: ChatMessage = {
        id: tempId,
        sender_id: currentUser.id,
        receiver_id: receiverId,
        message,
        created_at: new Date().toISOString(),
        sender: currentUser
      };
      
      setChatMessages(prev => [...prev, tempMsg]);

      const { error } = await supabase.from('chat_messages').insert({
        sender_id: currentUser.id,
        receiver_id: receiverId || null,
        content: message
      });
      if (error) {
        toast.error('Erro ao enviar mensagem');
        fetchData(); // revert
      }
    },
    [currentUser, supabase, fetchData]
  );

  // Atualizar SelectedTask caso as tasks mudem no banco para refletir novos comentários ao vivo
  useEffect(() => {
    if (selectedTask) {
      const freshTask = tasks.find(t => t.id === selectedTask.id);
      if (freshTask && JSON.stringify(freshTask) !== JSON.stringify(selectedTask)) {
        setSelectedTask(freshTask);
      }
    }
  }, [tasks, selectedTask]);

  return (
    <KanbanContext.Provider
      value={{
        tasks,
        columns,
        chatMessages,
        selectedTask,
        showCreateModal,
        chatTabs,
        overdueTasks,
        setSelectedTask,
        setShowCreateModal,
        openChatTab,
        closeChatTab,
        minimizeChatTab,
        setChatDraft,
        setChatMention,
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

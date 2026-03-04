"use client";
import React, { useState } from 'react';
import { Search, Bell, MessageSquare, Plus, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useKanban } from '@/context/KanbanContext';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { Notification } from '@/types';
import { useEffect } from 'react';

import Avatar from './Avatar';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { setShowCreateModal, overdueTasks, setSelectedTask } = useKanban();
  const [showWarnings, setShowWarnings] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchNotifs = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('read', false)
        .order('created_at', { ascending: false });
      
      if (data) setNotifications(data);
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [currentUser, supabase]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = overdueTasks.length + notifications.length;
  const hasCustomBg = !!currentUser?.background_url;

  return (
    <header className={`relative z-50 h-16 flex items-center gap-4 px-6 shrink-0 transition-colors ${hasCustomBg ? 'bg-black/20 backdrop-blur-md border-b border-white/10' : 'bg-[#1e2336] border-b border-[#2a3254]'}`} suppressHydrationWarning>
      {/* Search */}
      <div className="relative flex-1 max-w-sm" suppressHydrationWarning>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar tarefas..."
          className="w-full pl-9 pr-4 h-9 rounded-lg bg-black/40 backdrop-blur-md shadow-inner text-sm text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
        />
      </div>

      <div className="flex-1" suppressHydrationWarning />

      {/* Add task */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowCreateModal(true)}
        className="flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Nova Tarefa
      </motion.button>

      {/* Overdue bell */}
      <div className="relative">
        <button 
          title="Avisos de prazo" 
          aria-label="Avisos de prazo" 
          onClick={() => setShowWarnings(!showWarnings)}
          className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${showWarnings ? 'bg-black/40 backdrop-blur-md border border-white/10 text-white' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {showWarnings && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-12 w-80 bg-[#0f121d]/95 backdrop-blur-2xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] border border-white/10 z-[100] overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-white/5 bg-gradient-to-r from-blue-500/10 to-transparent">
                <h3 className="text-sm font-black text-white drop-shadow-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-400" /> Avisos
                </h3>
              </div>
              
              <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
                {unreadCount === 0 ? (
                  <div className="py-6 px-4 text-center">
                    <p className="text-xs text-slate-400">Nenhum aviso no momento.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* ATENÇÃO: TAREFAS ATRASADAS */}
                    {overdueTasks.length > 0 && (
                      <div className="space-y-1">
                        <div className="px-4 py-2 mt-2 mb-1 border-l-2 border-red-500 bg-red-500/5">
                          <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">
                            Tarefas em Atraso ({overdueTasks.length})
                          </p>
                        </div>
                        {overdueTasks.map((task) => (
                          <button
                            key={task.id}
                            onClick={() => {
                              setSelectedTask(task);
                              setShowWarnings(false);
                            }}
                            className="w-full text-left p-3 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10 group mx-2 max-w-[calc(100%-16px)]"
                          >
                            <p className="text-sm font-bold text-white drop-shadow-md group-hover:text-red-400 transition-colors line-clamp-1">
                              {task.title}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 font-medium flex items-center gap-1">
                              Clique para saber mais <span className="text-red-500">→</span>
                            </p>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* NOTIFICAÇÕES (FÓRUM/IDEIAS) */}
                    {notifications.length > 0 && (
                      <div className="space-y-1">
                        <div className="px-4 py-2 mt-2 mb-1 border-l-2 border-blue-500 bg-blue-500/5">
                          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                            Ideias da Equipe ({notifications.length})
                          </p>
                        </div>
                        {notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => {
                              handleMarkAsRead(n.id);
                              setShowWarnings(false);
                            }}
                            className="w-full text-left p-3 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10 group mx-2 max-w-[calc(100%-16px)]"
                          >
                            <p className="text-sm font-bold text-white drop-shadow-md group-hover:text-blue-400 transition-colors line-clamp-1">
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat toggle - Removed because chat is now always available via floating buttons */}

      {/* User + logout */}
      <div className="flex items-center gap-2 ml-1" suppressHydrationWarning>
        <div
          className="relative group rounded-full bg-black/40 backdrop-blur-md shadow-md flex items-center justify-center outline-none ring-2 ring-transparent focus:ring-blue-400 hover:ring-blue-500 transition-all cursor-default"
          title="Ver Menu Lateral para Configurações"
        >
          <Avatar 
            src={currentUser?.avatar_url} 
            name={currentUser?.full_name} 
            className="w-8 h-8 border-2 border-slate-700 rounded-full"
          />
        </div>
        <button
          onClick={logout}
          className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

    </header>
  );
}

"use client";
import React from 'react';
import { Search, Bell, MessageSquare, Plus, LogOut, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useKanban } from '@/context/KanbanContext';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { setShowCreateModal, setShowChat, showChat, overdueTasks } = useKanban();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-6 flex-shrink-0">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar tarefas..."
          className="w-full pl-9 pr-4 h-9 rounded-lg bg-slate-100 text-sm text-slate-700 placeholder-slate-400 border border-transparent focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
        />
      </div>

      <div className="flex-1" />

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
      <button title="Avisos de prazo" aria-label="Avisos de prazo" className="relative w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors">
        <Bell className="w-5 h-5" />
        {overdueTasks.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {overdueTasks.length}
          </span>
        )}
      </button>

      {/* Chat toggle */}
      <button
        onClick={() => setShowChat(!showChat)}
        title="Abrir chat"
        aria-label="Abrir chat"
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
          showChat ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
        }`}
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {/* User + logout */}
      <div className="flex items-center gap-2 ml-1">
        <img
          src={currentUser?.avatar_url}
          alt={currentUser?.full_name}
          className="w-8 h-8 rounded-full border-2 border-slate-200"
        />
        <button
          onClick={logout}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

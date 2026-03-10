"use client";
import React, { useState, useMemo } from 'react';
import { MessageSquarePlus, X, Globe2 } from 'lucide-react';
import { useKanban } from '@/context/KanbanContext';
import { useAuth } from '@/context/AuthContext';
import FloatingChat from './FloatingChat';

export default function FloatingChatContainer() {
  const { chatTabs, openChatTab, chatMessages } = useKanban();
  const { currentUser, availableUsers } = useAuth();
  const [showUserList, setShowUserList] = useState(false);

  // Exclude current user from the DM list
  const dmUsers = availableUsers.filter(u => u.id !== currentUser?.id);

  // Read the persisted lastReadAt map from localStorage once
  const readMap: Record<string, string> = useMemo(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('kanban_chat_read') : null;
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  }, []);

  // Helper: get lastReadAt for a tab — prefers in-memory state, falls back to localStorage
  const getLastReadAt = (tabId: string): string | undefined => {
    const tab = chatTabs.find(t => t.id === tabId);
    return tab?.lastReadAt ?? readMap[tabId];
  };

  // Count unread DM messages: messages received AFTER lastReadAt (state or localStorage)
  const unreadCount = useMemo(() => {
    if (!currentUser) return 0;

    return chatMessages.filter(m => {
      if (m.receiver_id !== currentUser.id) return false;
      if (m.sender_id === currentUser.id) return false;
      const lastRead = getLastReadAt(m.sender_id);
      if (!lastRead) return true; // never opened = unread
      return new Date(m.created_at) > new Date(lastRead);
    }).length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages, chatTabs, currentUser, readMap]);

  const handleOpenGlobal = () => {
    openChatTab('global', 'global', 'Chat da Equipe');
    setShowUserList(false);
  };

  const handleOpenDM = (userId: string, userName: string) => {
    openChatTab(userId, 'dm', userName);
    setShowUserList(false);
  };

  const openTabs = chatTabs.filter(t => t.isOpen);

  return (
    <div className="fixed bottom-0 right-6 z-50 flex items-end gap-4 pointer-events-none" suppressHydrationWarning>
      
      {/* Active Chat Tabs */}
      {openTabs.map((tab) => (
        <FloatingChat key={tab.id} tab={tab} />
      ))}

      {/* FAB - Action Button */}
      <div className="relative pointer-events-auto pb-6" suppressHydrationWarning>
        <button
          onClick={() => setShowUserList(!showUserList)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all ${
            showUserList ? 'bg-slate-700' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30'
          }`}
        >
          {showUserList ? <X className="w-6 h-6" /> : <MessageSquarePlus className="w-6 h-6 ml-0.5" />}
        </button>

        {/* Unread Badge */}
        {!showUserList && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* User Selection Popover */}
        {showUserList && (
          <div className="absolute bottom-6 right-20 w-72 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-right-2 fade-in duration-200">
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800">
              <h4 className="text-sm font-bold text-white">Nova Conversa</h4>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
              {/* Global Chat Option */}
              <button
                onClick={handleOpenGlobal}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                  <Globe2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h5 className="text-[13px] font-bold text-slate-200">Chat da Equipe</h5>
                  <p className="text-[10px] text-slate-500">Mural geral</p>
                </div>
              </button>

              <div className="h-px bg-slate-800 my-2 mx-2" />
              
              <div className="px-3 pb-2 pt-1">
                 <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Direto</span>
              </div>

              {/* Specific Users */}
              {dmUsers.map((u) => {
                // Count unread messages from this specific user using lastReadAt (state + localStorage fallback)
                const userUnread = chatMessages.filter(m => {
                  if (m.sender_id !== u.id) return false;
                  if (m.receiver_id !== currentUser?.id) return false;
                  const lastRead = getLastReadAt(u.id);
                  if (!lastRead) return true; // never opened = unread
                  return new Date(m.created_at) > new Date(lastRead);
                }).length;

                return (
                  <button
                    key={u.id}
                    onClick={() => handleOpenDM(u.id, u.full_name)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name}&background=random`} alt={u.full_name} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                      {userUnread > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                          {userUnread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h5 className="text-[13px] font-bold text-slate-200">{u.full_name}</h5>
                      <p className="text-[10px] text-slate-500">{u.area || u.role}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

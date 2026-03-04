"use client";
import React, { useRef, useEffect, useMemo } from 'react';
import { Send, X, Minus, Maximize2, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useKanban } from '@/context/KanbanContext';
import { useAuth } from '@/context/AuthContext';
import { ChatMessage, ChatTabState } from '@/types';
import { useDroppable } from '@dnd-kit/core';

interface FloatingChatProps {
  tab: ChatTabState;
}

function formatMessage(text: string, openTaskModal: (id: string) => void) {
  const parts = text.split(/(#\w+[-\w]*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      const taskId = part.substring(1);
      return (
        <span
          key={i}
          className="bg-blue-100 text-blue-600 px-1 rounded cursor-pointer font-bold hover:underline"
          onClick={() => openTaskModal(taskId)}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function FloatingChat({ tab }: FloatingChatProps) {
  const { chatMessages, sendChatMessage, closeChatTab, minimizeChatTab, setChatDraft, setChatMention, getTaskById, setSelectedTask } = useKanban();
  const { currentUser } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Setup droppable
  const { setNodeRef, isOver } = useDroppable({
    id: `chat-${tab.id}`,
  });

  // Filter messages for this specific tab
  const filteredMessages = useMemo(() => {
    if (tab.type === 'global') {
      return chatMessages.filter(m => !m.receiver_id);
    } else {
      // DM messages involving the current user and the tab.id (the other person)
      return chatMessages.filter(m => 
        (m.sender_id === currentUser?.id && m.receiver_id === tab.id) ||
        (m.sender_id === tab.id && m.receiver_id === currentUser?.id)
      );
    }
  }, [chatMessages, tab.type, tab.id, currentUser?.id]);

  useEffect(() => {
    if (!tab.isMinimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages, tab.isMinimized]);

  const handleSend = () => {
    if ((!tab.draft.trim() && !tab.draftMention) || !currentUser) return;
    
    // Prefix the message with the hashtag if there is a mention
    const prefix = tab.draftMention ? `#${tab.draftMention.taskId} ` : '';
    const finalMessage = `${prefix}${tab.draft.trim()}`;
    
    sendChatMessage(finalMessage, tab.type === 'dm' ? tab.id : undefined);
    setChatDraft(tab.id, '');
    if (tab.draftMention) {
      setChatMention(tab.id, undefined);
    }
  };

  const openTaskModal = (taskId: string) => {
    const task = getTaskById(taskId);
    if (task) setSelectedTask(task);
  };

  const grouped: { date: string; messages: ChatMessage[] }[] = [];
  filteredMessages.forEach((msg) => {
    const dateStr = format(new Date(msg.created_at), 'dd MMM yyyy', { locale: ptBR });
    const last = grouped[grouped.length - 1];
    if (!last || last.date !== dateStr) grouped.push({ date: dateStr, messages: [msg] });
    else last.messages.push(msg);
  });

  return (
    <div 
      className={`flex flex-col bg-slate-900 border border-slate-700/60 rounded-t-xl overflow-hidden drop-shadow-2xl transition-all duration-300 pointer-events-auto w-[340px] ${tab.isMinimized ? 'h-14' : 'h-[460px]'}`}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-3 bg-slate-800 border-b border-slate-700/60 cursor-pointer hover:bg-slate-700/50 transition-colors"
        onClick={() => minimizeChatTab(tab.id, !tab.isMinimized)}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          {/* Status Dot */}
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <h3 className="text-[13px] font-bold text-white truncate">{tab.chatName}</h3>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); minimizeChatTab(tab.id, !tab.isMinimized); }}
            title={tab.isMinimized ? "Maximizar" : "Minimizar"}
            aria-label={tab.isMinimized ? "Maximizar chat" : "Minimizar chat"}
            className="w-6 h-6 rounded-md hover:bg-slate-600/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            {tab.isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); closeChatTab(tab.id); }}
            title="Fechar"
            aria-label="Fechar chat"
            className="w-6 h-6 rounded-md hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!tab.isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-1 bg-[#151a2a]">
            {grouped.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <span className="text-xs">Nenhuma mensagem ainda.</span>
              </div>
            )}
            {grouped.map(({ date, messages }) => (
              <div key={date}>
                <div className="flex items-center gap-2 my-4">
                  <div className="flex-1 h-px bg-slate-700/50" />
                  <span className="text-[9px] font-medium text-slate-500 uppercase tracking-widest">{date}</span>
                  <div className="flex-1 h-px bg-slate-700/50" />
                </div>

                {messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUser?.id;
                  
                  // Format Sender Name & Team
                  let senderDisplay = msg.sender?.full_name || 'Usuário';
                  if (msg.sender?.area) {
                    senderDisplay += ` (${msg.sender.area})`;
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 mb-4 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      {!isOwn && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={msg.sender?.avatar_url || `https://ui-avatars.com/api/?name=${msg.sender?.full_name}&background=random`}
                          alt={msg.sender?.full_name}
                          className="w-7 h-7 rounded-full border border-slate-700/50 shrink-0 mt-0.5"
                        />
                      )}

                      <div className={`max-w-[85%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!isOwn && (
                          <span className="text-[10px] font-medium text-slate-400 mb-1 px-1">
                            {senderDisplay}
                          </span>
                        )}
                        <div
                          className={`px-3 py-2 text-[13px] leading-relaxed break-words shadow-sm ${
                            isOwn
                              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                              : 'bg-slate-800 border border-slate-700/50 text-slate-200 rounded-2xl rounded-tl-sm'
                          }`}
                        >
                          {formatMessage(msg.message, openTaskModal)}
                        </div>
                        <span className="text-[9px] text-slate-500 mt-1 px-1">
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} className="h-1" />
          </div>

          {/* Droppable Input Zone */}
          <div 
            ref={setNodeRef}
            className={`px-3 py-3 bg-slate-800 border-t border-slate-700/60 transition-colors ${isOver ? 'bg-blue-900/40 border-blue-500/50 border-t-2' : ''}`}
          >
            <div className={`flex flex-col gap-2 relative transition-all ${isOver ? 'ring-2 ring-blue-500/50 rounded-xl bg-blue-900/40 p-1' : ''}`}>
               {isOver && !tab.draftMention && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-blue-900/80 rounded-xl backdrop-blur-sm border border-blue-500/50 text-blue-200 text-xs font-medium tracking-wide">
                  Solte a tarefa aqui...
                </div>
               )}
               {tab.draftMention && (
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-1.5 truncate">
                    <Hash className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs font-medium truncate">{tab.draftMention.title || tab.draftMention.taskId}</span>
                  </div>
                  <button 
                    onClick={() => setChatMention(tab.id, undefined)}
                    title="Remover tarefa"
                    aria-label="Remover tarefa"
                    className="ml-2 p-0.5 rounded-full hover:bg-blue-500/20 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5"/>
                  </button>
                </div>
               )}
              <div className="flex gap-2">
                <input
                  value={tab.draft}
                  onChange={(e) => setChatDraft(tab.id, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={isOver ? "" : tab.draftMention ? "Digite uma mensagem..." : "Mensagem... arraste um card aqui"}
                  className="flex-1 bg-slate-900/80 text-slate-200 placeholder-slate-500 text-sm px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-xs"
                />
                <button
                  onClick={handleSend}
                  disabled={!tab.draft.trim() && !tab.draftMention}
                  title="Enviar mensagem"
                  aria-label="Enviar mensagem"
                  className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white flex items-center justify-center shrink-0 transition-colors shadow-lg shadow-blue-600/20"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

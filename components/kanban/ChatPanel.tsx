"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useKanban } from '@/context/KanbanContext';
import { useAuth } from '@/context/AuthContext';
import { ChatMessage } from '@/types';

/**
 * formatMessage – detecta menções #palavra e transforma em link clicável.
 * Ao clicar numa menção, chama openTaskModal(taskId) conforme spec.
 */
function formatMessage(text: string, openTaskModal: (id: string) => void) {
  const parts = text.split(/(#\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      const taskId = part.substring(1); // remove o '#'
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

export default function ChatPanel() {
  const { chatMessages, sendChatMessage, getTaskById, setSelectedTask } = useKanban();
  const { currentUser } = useAuth();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = () => {
    if (!input.trim() || !currentUser) return;
    sendChatMessage(input.trim());
    setInput('');
  };

  // Abre o modal da tarefa ao clicar numa menção #id (conforme spec: openTaskModal)
  const openTaskModal = (taskId: string) => {
    const task = getTaskById(taskId);
    if (task) setSelectedTask(task);
  };

  // Group messages — show date dividers
  const grouped: { date: string; messages: ChatMessage[] }[] = [];
  chatMessages.forEach((msg) => {
    const dateStr = format(new Date(msg.created_at), 'dd MMM yyyy', { locale: ptBR });
    const last = grouped[grouped.length - 1];
    if (!last || last.date !== dateStr) grouped.push({ date: dateStr, messages: [msg] });
    else last.messages.push(msg);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div>
          <h3 className="text-sm font-bold text-white">Chat da Equipe</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Use #task-id para referenciar tarefas</p>
        </div>
        <button
          title="Fechar chat"
          aria-label="Fechar chat"
          className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-1">
        {grouped.map(({ date, messages }) => (
          <div key={date}>
            {/* Date divider */}
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">{date}</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            {messages.map((msg) => {
              const isOwn = msg.sender_id === currentUser?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  {!isOwn && (
                    <img
                      src={msg.sender?.avatar_url}
                      alt={msg.sender?.full_name}
                      className="w-7 h-7 rounded-full border border-slate-700 shrink-0 mt-0.5"
                    />
                  )}

                  <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isOwn && (
                      <span className="text-[10px] font-semibold text-slate-400 mb-1 px-1">
                        {msg.sender?.full_name}
                      </span>
                    )}
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                        isOwn
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-slate-800 text-slate-200 rounded-tl-sm'
                      }`}
                    >
                      {formatMessage(msg.message, openTaskModal)}
                    </div>
                    <span className="text-[9px] text-slate-600 mt-1 px-1">
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Mensagem... use #task-id"
            className="flex-1 bg-slate-800 text-slate-200 placeholder-slate-600 text-sm px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

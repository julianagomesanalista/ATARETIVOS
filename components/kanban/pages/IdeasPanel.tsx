"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Idea, IdeaComment } from '@/types';
import { Lightbulb, Send, MessageSquare, Trash2, Clock, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function IdeasPanel() {
  const { currentUser, availableUsers } = useAuth();
  const [supabase] = useState(() => createClient());

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [comments, setComments] = useState<Record<string, IdeaComment[]>>({});
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaDesc, setNewIdeaDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedIdea, setExpandedIdea] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      const { data: ideasData, error: ideasErr } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false });

      if (ideasErr) throw ideasErr;

      const { data: commentsData, error: commentsErr } = await supabase
        .from('idea_comments')
        .select('*')
        .order('created_at', { ascending: true });

      if (commentsErr) throw commentsErr;

      const allUsers = currentUser
        ? [...availableUsers.filter(u => u.id !== currentUser.id), currentUser]
        : availableUsers;

      const mappedIdeas = (ideasData || []).map(i => ({
        ...i,
        creator: allUsers.find(u => u.id === i.creator_id)
      }));
      setIdeas(mappedIdeas);

      const groupedComments: Record<string, IdeaComment[]> = {};
      (commentsData || []).forEach(c => {
        if (!groupedComments[c.idea_id]) groupedComments[c.idea_id] = [];
        groupedComments[c.idea_id].push({
          ...c,
          user: allUsers.find(u => u.id === c.user_id)
        });
      });
      setComments(groupedComments);
    } catch (error) {
      console.error('Erro ao carregar Fórum', error);
      toast.error('Erro ao carregar o Fórum de Ideias');
    } finally {
      setLoading(false);
    }
  }, [availableUsers, supabase, currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newIdeaTitle.trim() || !newIdeaDesc.trim()) return;
    setSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('ideas')
        .insert({
          title: newIdeaTitle.trim(),
          description: newIdeaDesc.trim(),
          creator_id: currentUser.id
        })
        .select()
        .single();

      if (error) throw error;

      // Notificar os gestores da mesma área
      if (currentUser.area) {
        const gestores = availableUsers.filter(
          u => u.role === 'gestor' && u.area === currentUser.area && u.id !== currentUser.id
        );
        
        const notifPromises = gestores.map(g => 
          supabase.from('notifications').insert({
            user_id: g.id,
            title: 'Nova Ideia na sua Área',
            message: `${currentUser.full_name?.split(' ')[0]} postou uma ideia: "${data.title}"`,
            link_type: 'idea'
          })
        );
        
        await Promise.allSettled(notifPromises);
      }

      toast.success('Ideia compartilhada com a equipe! 🎉');
      setNewIdeaTitle('');
      setNewIdeaDesc('');
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Ocorreu um erro ao compartilhar a ideia.');
    } finally {
      setSubmitting(false);
    }
  };

  const [commenting, setCommenting] = useState<Record<string, boolean>>({});

  const handlePostComment = async (ideaId: string) => {
    const text = commentInputs[ideaId];
    if (!currentUser || !text?.trim()) return;

    setCommenting(prev => ({ ...prev, [ideaId]: true }));
    try {
      const { error } = await supabase
        .from('idea_comments')
        .insert({
          idea_id: ideaId,
          user_id: currentUser.id,
          content: text.trim()
        });

      if (error) throw error;

      setCommentInputs(prev => ({ ...prev, [ideaId]: '' }));
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao publicar comentário.');
    } finally {
      setCommenting(prev => ({ ...prev, [ideaId]: false }));
    }
  };

  const handleDeleteIdea = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja apagar esta ideia?')) return;
    try {
      const { error } = await supabase.from('ideas').delete().eq('id', id);
      if (error) throw error;
      toast.success('Ideia removida.');
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao deletar a ideia.');
    }
  };

  const canDeleteIdea = (creatorId: string) => {
    return currentUser?.id === creatorId || currentUser?.role === 'admin' || currentUser?.role === 'master';
  };

  const hasCustomBg = !!currentUser?.background_url;

  return (
    <div className={`w-full p-4 md:p-8 min-h-full h-auto text-slate-200 ${hasCustomBg ? 'bg-transparent' : 'bg-[#1e2336]'}`}>
      <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-32">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-xl shadow-yellow-500/20 flex flex-col items-center justify-center shrink-0">
            <Lightbulb className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-white tracking-wide drop-shadow-md">Painel de Ideias</h1>
            <p className="text-slate-200 font-medium mt-1 drop-shadow">Compartilhe insights e melhorias para a equipe.</p>
          </div>
        </div>

        {/* POSTAR NOVA IDEIA */}
        <div className="w-full bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-yellow-400 to-orange-500 opacity-80" />
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Surgiu uma ideia? Posta aí!
          </h2>
          <form onSubmit={handleSubmitIdea} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Dê um título atrativo para a sua ideia..."
              value={newIdeaTitle}
              onChange={(e) => setNewIdeaTitle(e.target.value)}
              className="w-full bg-black/40 backdrop-blur-md text-white border border-white/10 shadow-inner rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition-all font-medium placeholder-slate-400"
              maxLength={100}
            />
            <textarea
              placeholder="Descreva sua ideia em detalhes. O que muda? Como vai ajudar a equipe?"
              value={newIdeaDesc}
              onChange={(e) => setNewIdeaDesc(e.target.value)}
              rows={4}
              className="w-full bg-black/40 backdrop-blur-md text-white border border-white/10 shadow-inner rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition-all resize-none scrollbar-thin placeholder-slate-400"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newIdeaTitle.trim() || !newIdeaDesc.trim()}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg shadow-yellow-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Compartilhando...' : 'Compartilhar Ideia'}
                <Send className="w-4 h-4 ml-1" />
              </button>
            </div>
          </form>
        </div>

        {/* FEED DE IDEIAS */}
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-4 mt-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Ideias Recentes da Equipe
            <span className="bg-slate-700 text-xs px-2.5 py-0.5 rounded-full text-slate-300 font-medium">
              {ideas.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-16 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl border-dashed shadow-xl">
            <Lightbulb className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 text-lg">O fórum está quietinho...</p>
            <p className="text-slate-500 text-sm mt-1">Seja o primeiro a compartilhar uma grande ideia!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {ideas.map((idea) => {
              const ideaComments = comments[idea.id] || [];
              const isExpanded = expandedIdea === idea.id;
              const hasComments = ideaComments.length > 0;

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idea.id} 
                  className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-xl transition-all hover:border-white/20"
                >
                  {/* Cabeçalho da Ideia */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={idea.creator?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(idea.creator?.full_name || 'User')}&background=random`}
                        alt={idea.creator?.full_name}
                        className="w-11 h-11 rounded-full border-2 border-slate-600 object-cover shrink-0"
                      />
                      <div>
                        <h3 className="text-slate-200 font-semibold text-base leading-tight">
                          {idea.creator?.full_name || 'Usuário Desconhecido'}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <span className="bg-slate-700/50 px-2 py-0.5 rounded-md font-medium text-slate-300">
                            {idea.creator?.area || 'Sem Área'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(idea.created_at), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {canDeleteIdea(idea.creator_id) && (
                      <button
                        onClick={() => handleDeleteIdea(idea.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700/30 rounded-lg transition-colors"
                        title="Apagar Ideia"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Conteúdo da Ideia */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-white mb-2 leading-tight">{idea.title}</h2>
                    <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {idea.description}
                    </p>
                  </div>

                  {/* Interações */}
                  <div className="border-t border-slate-700/50 pt-4 flex items-center justify-between">
                    <button
                      onClick={() => setExpandedIdea(isExpanded ? null : idea.id)}
                      className="flex items-center gap-2 text-sm font-semibold transition-colors rounded-lg px-3 py-1.5 -ml-3
                        text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {hasComments ? `${ideaComments.length} Comentários` : 'Comentar'}
                    </button>
                  </div>

                  {/* Área de Comentários (Expansível) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 bg-[#1e2336] rounded-xl p-4 border border-slate-700/50">
                          {/* Lista de Comentários */}
                          {hasComments ? (
                            <div className="flex flex-col gap-5 mb-5 max-h-80 overflow-y-auto scrollbar-thin pr-2">
                              {ideaComments.map(comment => (
                                <div key={comment.id} className="flex gap-3">
                                  <img
                                    src={comment.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.full_name || 'U')}&background=random`}
                                    alt={comment.user?.full_name}
                                    className="w-8 h-8 rounded-full border border-slate-600 object-cover shrink-0"
                                  />
                                  <div className="flex-1 bg-black/40 backdrop-blur-md p-3 rounded-xl rounded-tl-none border border-white/10 shadow-lg">
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-sm font-semibold text-slate-200">
                                        {comment.user?.full_name || 'Desconhecido'}
                                      </span>
                                      <span className="text-[10px] text-slate-500">
                                        {format(new Date(comment.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 text-center mb-4 py-2">
                              Ainda não há comentários. Seja o primeiro!
                            </p>
                          )}

                          {/* Input de Novo Comentário */}
                          <div className="flex gap-3 items-end">
                            <div className="flex-1">
                              <textarea
                                value={commentInputs[idea.id] || ''}
                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [idea.id]: e.target.value }))}
                                placeholder="Escreva seu comentário..."
                                rows={1}
                                className="w-full bg-black/40 backdrop-blur-md text-sm text-white border border-white/10 shadow-inner rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 resize-none scrollbar-thin"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handlePostComment(idea.id);
                                  }
                                }}
                              />
                            </div>
                            <button
                              onClick={() => handlePostComment(idea.id)}
                              disabled={!commentInputs[idea.id]?.trim() || commenting[idea.id]}
                              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-3 rounded-xl transition-colors shadow-lg shadow-blue-600/20 shrink-0 flex items-center justify-center min-w-[48px]"
                              title="Enviar"
                            >
                              {commenting[idea.id] ? (
                                <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 text-right">
                            Pressione <span className="font-semibold bg-slate-800 px-1 rounded">Enter</span> para enviar
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

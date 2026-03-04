"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Edit2, Trash2, Clock, Calendar } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Comment, Complexity, Status } from '@/types';
import { useKanban } from '@/context/KanbanContext';
import { useAuth } from '@/context/AuthContext';
import { COMPLEXITY_LABELS, formatTimeLabel, getTimeProgress, getProgressBarColor, isOverdue } from '@/utils/sla';

const STATUS_LABELS = { todo: 'A Fazer', doing: 'Fazendo', done: 'Feito' };
const STATUS_COLORS = { todo: 'bg-red-100 text-red-700', doing: 'bg-yellow-100 text-yellow-700', done: 'bg-green-100 text-green-700' };

export default function TaskDetailModal() {
  const { selectedTask, setSelectedTask, deleteTask, updateTask, addComment, editComment, deleteComment } = useKanban();
  const { currentUser, canEditComment, canDeleteTask } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Task Edit State
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskComplexity, setEditTaskComplexity] = useState<Complexity>('facil');
  const [editTaskCompany, setEditTaskCompany] = useState('');
  const [editTaskStatus, setEditTaskStatus] = useState<Status>('todo');
  const [editTaskDate, setEditTaskDate] = useState('');

  // Sync state when entering edit mode
  const handleStartTaskEdit = () => {
    if (!task) return;
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || '');
    setEditTaskComplexity(task.complexity);
    setEditTaskCompany(task.company_name || '');
    setEditTaskStatus(task.status);
    
    // Format date for the YYYY-MM-DD local input
    const dateObj = new Date(task.created_at);
    const localDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    setEditTaskDate(localDateStr);
    
    setIsEditingTask(true);
  };

  const handleSaveTaskEdits = () => {
    if (!task || !editTaskTitle.trim()) return;
    
    // Re-calculate the due date if the user changed the start date or complexity
    const calculatedCreatedAt = new Date(editTaskDate).toISOString();
    const newDueDate = isNaN(new Date(editTaskDate).getTime()) 
      ? task.due_date 
      : addDays(new Date(editTaskDate), COMPLEXITY_LABELS[editTaskComplexity] ? (editTaskComplexity === 'facil' ? 2 : editTaskComplexity === 'medio' ? 5 : 15) : 0).toISOString();

    updateTask(task.id, {
      title: editTaskTitle.trim(),
      description: editTaskDescription.trim(),
      complexity: editTaskComplexity,
      company_name: editTaskCompany.trim(),
      status: editTaskStatus,
      created_at: calculatedCreatedAt,
      due_date: newDueDate
    });
    setIsEditingTask(false);
  };

  if (!selectedTask) return null;
  const task = selectedTask;
  const overdue = isOverdue(task);
  const showTimer = task.status !== 'done';

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addComment(task.id, newComment.trim());
    setNewComment('');
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editContent.trim()) return;
    editComment(editingId, editContent.trim());
    setEditingId(null);
    setEditContent('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedTask(null)}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex-1 min-w-0 pr-4">
              {/* Status + company */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {isEditingTask ? (
                  <select 
                    value={editTaskStatus} 
                    onChange={e => setEditTaskStatus(e.target.value as Status)}
                    className="text-[10px] p-0.5 border rounded bg-white font-bold"
                  >
                    <option value="todo">A Fazer</option>
                    <option value="doing">Fazendo</option>
                    <option value="done">Feito</option>
                  </select>
                ) : (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                )}
                
                {isEditingTask ? (
                  <input
                    type="text"
                    value={editTaskCompany}
                    onChange={e => setEditTaskCompany(e.target.value)}
                    placeholder="Empresa/Projeto"
                    className="text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-blue-400 focus:outline-none p-0.5"
                  />
                ) : (
                  task.company_name && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {task.company_name}
                    </span>
                  )
                )}
                
                {task.tags.map((tag) => (
                  <span key={tag.name} className={`px-2 py-0.5 rounded-full text-[9px] font-bold text-white ${tag.color}`}>
                    {tag.name}
                  </span>
                ))}
              </div>
              {isEditingTask ? (
                <div className="mb-2 space-y-2">
                  <input 
                    type="text" 
                    value={editTaskTitle} 
                    onChange={e => setEditTaskTitle(e.target.value)} 
                    className="w-full font-bold text-slate-800 text-base border-b border-blue-400 focus:outline-none focus:border-blue-600 bg-blue-50/50 p-1"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500 font-semibold">Complexidade:</label>
                    <select 
                      value={editTaskComplexity} 
                      onChange={e => setEditTaskComplexity(e.target.value as Complexity)}
                      className="text-xs p-1 border rounded bg-white"
                    >
                      <option value="facil">Fácil</option>
                      <option value="medio">Médio</option>
                      <option value="dificil">Difícil</option>
                    </select>
                  </div>
                </div>
              ) : (
                <h2 className="text-base font-bold text-slate-800 leading-snug">{task.title}</h2>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isEditingTask ? (
                <>
                  <button onClick={handleSaveTaskEdits} className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700">Salvar</button>
                  <button onClick={() => setIsEditingTask(false)} className="px-3 py-1 text-slate-500 text-xs font-bold hover:bg-slate-100 rounded">Cancelar</button>
                </>
              ) : (
                <>
                  {canDeleteTask(task.id) && (
                    <>
                      <button
                        onClick={handleStartTaskEdit}
                        className="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-500 flex items-center justify-center text-slate-400 transition-colors"
                        title="Editar tarefa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { if (window.confirm('Excluir tarefa?')) deleteTask(task.id); }}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-slate-400 transition-colors"
                        title="Excluir tarefa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedTask(null)}
                    title="Fechar"
                    aria-label="Fechar modal"
                    className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="px-6 py-4 space-y-5">
              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-slate-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Criado em</p>
                  {isEditingTask ? (
                    <input 
                      type="date"
                      value={editTaskDate}
                      onChange={e => setEditTaskDate(e.target.value)}
                      className="font-semibold text-slate-700 bg-white border p-1 rounded"
                    />
                  ) : (
                    <p className="font-semibold text-slate-700">
                      {format(new Date(task.created_at), "d MMM yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-slate-400 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Prazo SLA</p>
                  <p className={`font-semibold ${overdue ? 'text-red-600' : 'text-slate-700'}`}>
                    {format(new Date(task.due_date), "d MMM yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-slate-400 mb-1">Complexidade</p>
                  <p className="font-semibold text-slate-700">{COMPLEXITY_LABELS[task.complexity]}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-slate-400 mb-1">Criador</p>
                  <div className="flex items-center gap-1.5">
                    <img src={task.creator?.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                    <p className="font-semibold text-slate-700 truncate">{task.creator?.full_name}</p>
                  </div>
                </div>
              </div>

              {/* SLA Bar */}
              {showTimer && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className={`font-medium ${overdue ? 'text-red-500' : 'text-slate-600'}`}>
                      {formatTimeLabel(task)}
                    </span>
                    <span className="text-slate-400">{Math.round(getTimeProgress(task))}% consumido</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressBarColor(task)}`}
                      style={{ width: `${getTimeProgress(task)}%` }}
                    />
                  </div>
                </div>
              )}
              {/* Description */}
              {isEditingTask ? (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Descrição</p>
                  <textarea 
                    value={editTaskDescription} 
                    onChange={e => setEditTaskDescription(e.target.value)} 
                    rows={4}
                    className="w-full text-sm text-slate-700 leading-relaxed border border-blue-200 rounded-lg p-3 bg-blue-50/30 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
                  />
                </div>
              ) : (
                task.description && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Descrição</p>
                    <p className="text-sm text-slate-700 leading-relaxed max-w-none whitespace-pre-wrap">{task.description}</p>
                  </div>
                )
              )}
              {/* Comments */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Comentários ({task.comments.length})
                </p>

                <div className="space-y-3 mb-4">
                  {task.comments.map((comment) => {
                    const canEdit = canEditComment(comment);
                    const isEditing = editingId === comment.id;

                    return (
                      <div key={comment.id} className="flex gap-3">
                        <img
                          src={comment.user?.avatar_url}
                          alt={comment.user?.full_name}
                          className="w-7 h-7 rounded-full border border-slate-200 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-700">{comment.user?.full_name}</span>
                            <span className="text-[10px] text-slate-400">
                              {format(new Date(comment.created_at), "d MMM, HH:mm", { locale: ptBR })}
                            </span>
                            {comment.is_edited && (
                              <span className="text-[10px] text-slate-400 italic">(editado)</span>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="flex gap-2">
                              <input
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-blue-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                autoFocus
                              />
                              <button onClick={handleSaveEdit} className="text-xs text-blue-600 font-semibold px-2">Salvar</button>
                              <button onClick={() => setEditingId(null)} className="text-xs text-slate-400 px-2">Cancelar</button>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-3 py-2 flex-1">
                                {comment.content}
                              </p>
                              {/* RBAC: edit/delete buttons role-locked */}
                              {canEdit && (
                                <div className="flex gap-1 flex-shrink-0 mt-1">
                                  <button
                                    onClick={() => handleStartEdit(comment)}
                                    className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors"
                                    title="Editar comentário"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => deleteComment(comment.id)}
                                    className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                                    title="Excluir comentário"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* New comment input */}
                {currentUser && (
                  <div className="flex gap-3">
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.full_name}
                      className="w-7 h-7 rounded-full border border-slate-200 flex-shrink-0"
                    />
                    <div className="flex-1 flex gap-2">
                      <input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                        placeholder="Adicionar comentário..."
                        title="Adicionar comentário"
                        aria-label="Adicionar comentário"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        title="Enviar comentário"
                        aria-label="Enviar comentário"
                        className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

"use client";
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Upload, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Complexity, Status, Tag } from '@/types';
import { useKanban } from '@/context/KanbanContext';
import { useAuth } from '@/context/AuthContext';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Regra de NegÃ³cio: Complexidade â†’ Prazo (SLA)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const complexityRules: Record<string, { days: number; color: string; label: string }> = {
  facil:   { days: 2,  color: 'bg-blue-500',   label: 'FÃ¡cil (AtÃ© 2 dias)' },
  medio:   { days: 5,  color: 'bg-yellow-500',  label: 'MÃ©dio (3 a 5 dias)' },
  dificil: { days: 15, color: 'bg-red-500',     label: 'DifÃ­cil (6 a 15 dias)' },
};

const PRESET_TAGS: Tag[] = [
  { name: 'MÃ­dia',     color: 'bg-purple-500' },
  { name: 'Urgente',   color: 'bg-red-500'    },
  { name: 'Proposta',  color: 'bg-green-500'  },
  { name: 'Design',    color: 'bg-pink-500'   },
  { name: 'Dev',       color: 'bg-cyan-500'   },
  { name: 'RelatÃ³rio', color: 'bg-emerald-500'},
];

export default function CreateTaskModal() {
  const { setShowCreateModal, createTask } = useKanban();
  const { currentUser } = useAuth();

  const [title,        setTitle]        = useState('');
  const [description,  setDescription]  = useState('');
  const [complexity,   setComplexity]   = useState<Complexity>('facil');
  const [status,       setStatus]       = useState<Status>('todo');
  const [company,      setCompany]      = useState('ATIVOS DIGITAL');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [files,        setFiles]        = useState<File[]>([]);
  const [startDate,    setStartDate]    = useState(
    new Date().toISOString().split('T')[0]
  );

  // Prazo calculado dinamicamente
  const dueDate = addDays(new Date(startDate), complexityRules[complexity].days);
  const dueDateLabel = format(dueDate, "d 'de' MMM yyyy", { locale: ptBR });

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': [],
      'application/vnd.ms-excel': [],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
    },
  });

  const toggleTag = (tag: Tag) => {
    setSelectedTags((prev) =>
      prev.some((t) => t.name === tag.name)
        ? prev.filter((t) => t.name !== tag.name)
        : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentUser) return;
    createTask({
      title:        title.trim(),
      description,
      status,
      complexity,
      creator_id:   currentUser.id,
      creator:      currentUser,
      company_name: company,
      tags:         selectedTags,
    });
    setShowCreateModal(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowCreateModal(false)}
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 z-10 max-h-[90vh] overflow-y-auto scrollbar-thin"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Nova Demanda</h2>
            <button
              onClick={() => setShowCreateModal(false)}
              title="Fechar"
              aria-label="Fechar modal"
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* TÃ­tulo */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="TÃ­tulo da tarefa..."
              className="w-full p-3 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-blue-500 text-sm outline-none"
            />

            {/* DescriÃ§Ã£o */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="DescriÃ§Ã£o (opcional)..."
              className="w-full p-3 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-blue-500 text-sm resize-none outline-none"
            />

            {/* Empresa */}
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Empresa / Projeto"
              className="w-full p-3 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-blue-500 text-sm outline-none"
            />

            {/* Complexidade */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Complexidade</label>
              <div className="flex gap-2 mt-2">
                {Object.keys(complexityRules).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setComplexity(key as Complexity)}
                    className={`flex-1 py-2 px-3 rounded-md text-[10px] font-bold transition-all ${
                      complexity === key
                        ? 'bg-black text-white shadow-lg'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {complexityRules[key].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Data + Prazo automÃ¡tico */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                  <Calendar size={12} /> Data Inicial
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  title="Data inicial"
                  aria-label="Data inicial da tarefa"
                  className="w-full mt-1 p-2 bg-gray-50 rounded-md border-none text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="bg-gray-50 p-2 rounded-md border border-dashed border-gray-300 flex flex-col justify-center">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Prazo Estimado</label>
                <p className="text-sm font-bold text-gray-700 mt-0.5">
                  +{complexityRules[complexity].days} dias Ãºteis
                </p>
                <p className="text-[10px] text-blue-600 font-semibold mt-0.5">{dueDateLabel}</p>
              </div>
            </div>

            {/* Coluna inicial */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Coluna inicial</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                title="Coluna inicial"
                aria-label="Selecionar coluna inicial"
                className="w-full p-3 bg-gray-50 rounded-lg border-none text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todo">A Fazer</option>
                <option value="doing">Fazendo</option>
                <option value="done">Feito</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_TAGS.map((tag) => {
                  const active = selectedTags.some((t) => t.name === tag.name);
                  return (
                    <button
                      key={tag.name}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border-2 transition-all ${
                        active
                          ? `${tag.color} text-white border-transparent`
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer group transition-colors ${
                isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-blue-50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload
                className={`mb-2 transition-colors ${isDragActive ? 'text-blue-500' : 'text-gray-300 group-hover:text-blue-500'}`}
                size={32}
              />
              <p className="text-xs text-gray-500 text-center">
                Arraste seus documentos ou{' '}
                <span className="text-blue-600 font-bold">procure no computador</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-1">PDF, Imagens, Excel</p>
            </div>

            {/* Ficheiros seleccionados */}
            {files.length > 0 && (
              <div className="space-y-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                    ðŸ“Ž {f.name}
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={!title.trim()}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all"
            >
              Criar Tarefa
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

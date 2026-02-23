"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { Task } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WarningDashboardProps {
  overdueTasks: Task[];
  onDismiss: () => void;
}

/**
 * WarningDashboard (Quadro de Avisos)
 * Aparece logo apÃ³s o login quando existem tarefas com prazo excedido.
 * SÃ³ renderiza se houver tarefas atrasadas â€” baseado no spec fornecido.
 */
export default function WarningDashboard({ overdueTasks, onDismiss }: WarningDashboardProps) {
  if (overdueTasks.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
        >
          {/* Ãcone */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 mx-auto">
            <AlertCircle className="text-red-600" size={32} />
          </div>

          {/* TÃ­tulo */}
          <h2 className="text-2xl font-black text-center text-gray-900 mb-2">
            Prazos Excedidos!
          </h2>
          <p className="text-center text-gray-500 mb-6">
            Existem{' '}
            <span className="font-bold text-red-600">{overdueTasks.length}</span>{' '}
            {overdueTasks.length === 1 ? 'tarefa que precisa' : 'tarefas que precisam'} de atenÃ§Ã£o
            imediata ou reajuste de cronograma.
          </p>

          {/* Lista de tarefas atrasadas */}
          <div className="max-h-48 overflow-y-auto space-y-3 mb-6 pr-2 scrollbar-thin">
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 bg-red-50 border border-red-100 rounded-xl flex justify-between items-center gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-red-700 truncate">{task.title}</p>
                  <p className="text-[10px] text-red-400 mt-0.5">
                    Venceu em{' '}
                    {format(new Date(task.due_date), "d 'de' MMM", { locale: ptBR })}
                  </p>
                </div>
                <span className="text-[10px] bg-red-600 text-white px-2 py-1 rounded-full uppercase whitespace-nowrap flex-shrink-0">
                  Atrasada
                </span>
              </div>
            ))}
          </div>

          {/* BotÃ£o de fechar */}
          <button
            onClick={onDismiss}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200"
          >
            Entendido, vou verificar
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

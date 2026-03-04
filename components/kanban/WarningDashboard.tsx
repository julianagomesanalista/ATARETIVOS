"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Sun, Moon, Sunset, CheckCircle2 } from 'lucide-react';
import { Task } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';

interface WarningDashboardProps {
  overdueTasks: Task[];
  onDismiss: () => void;
}

/**
 * WarningDashboard (Avisos DiÃ¡rios)
 * Aparece logo apÃ³s o login informando o status do usuÃ¡rio com relaÃ§Ã£o Ã s suas tarefas.
 */
export default function WarningDashboard({ overdueTasks, onDismiss }: WarningDashboardProps) {
  const { currentUser } = useAuth();
  
  // Saudação dinâmica baseada na hora atual
  const hour = new Date().getHours();
  let greetingMsg = 'Bom dia';
  let GreetingIcon = Sun;
  let greetingColor = 'text-amber-500';

  if (hour >= 12 && hour < 18) {
    greetingMsg = 'Boa tarde';
    GreetingIcon = Sunset;
    greetingColor = 'text-orange-500';
  } else if (hour >= 18 || hour < 5) {
    greetingMsg = 'Boa noite';
    GreetingIcon = Moon;
    greetingColor = 'text-indigo-400';
  }

  const hasOverdue = overdueTasks.length > 0;

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
          <div className="flex items-center justify-center gap-2 mb-6">
            <GreetingIcon className={`w-6 h-6 ${greetingColor}`} />
            <h2 className="text-xl font-medium text-gray-600">
              {greetingMsg}, <span className="font-bold text-gray-900">{currentUser?.full_name?.split(' ')[0] || 'Usuário'}</span>!
            </h2>
          </div>

          {hasOverdue ? (
            <>
              {/* Ícone */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner shadow-red-200">
                <AlertCircle className="text-red-600" size={32} />
              </div>

              {/* Título */}
              <h3 className="text-2xl font-black text-center text-gray-900 mb-2">
                Prazos Excedidos!
              </h3>
              <p className="text-center text-gray-500 mb-6">
                Existem{' '}
                <span className="font-bold text-red-600">{overdueTasks.length}</span>{' '}
                {overdueTasks.length === 1 ? 'tarefa que precisa' : 'tarefas que precisam'} de atenção
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
            </>
          ) : (
            <>
              {/* Layout de Sucesso / Sem atrasos */}
              <div className="w-20 h-20 bg-emerald-100/50 rounded-full flex items-center justify-center mb-8 mx-auto border-[4px] border-emerald-50">
                <CheckCircle2 className="text-emerald-500 w-10 h-10" />
              </div>

              <h3 className="text-2xl font-black text-center text-emerald-900 mb-2">
                Tudo em dia!
              </h3>
              <p className="text-center text-emerald-700/80 mb-8 font-medium px-4">
                Você está indo muito bem, não tem nenhuma demanda em atraso hoje!
              </p>
            </>
          )}

          {/* Botão de fechar */}
          <button
            onClick={onDismiss}
            className={`w-full text-white font-bold py-4 rounded-2xl transition-all shadow-xl ${
              hasOverdue 
                ? 'bg-gray-900 hover:bg-black shadow-gray-200' 
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50'
            }`}
          >
            {hasOverdue ? 'Entendido, vou verificar' : 'Entrar no Board'}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

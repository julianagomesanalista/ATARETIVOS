"use client";
import React, { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useKanban } from '@/context/KanbanContext';
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { isOverdue } from '@/utils/sla';

export default function UserEvolutionBoard() {
  const { currentUser } = useAuth();
  const { columns } = useKanban();

  const metrics = useMemo(() => {
    if (!currentUser) return null;

    let totalCreatedOrAssigned = 0;
    let completedTasks = 0;
    let overdueActive = 0;
    let doingTasks = 0;



    for (const col of columns) {
      for (const task of col.tasks) {
        totalCreatedOrAssigned++;
        
        if (col.id === 'done') {
          completedTasks++;
        } else {
          if (col.id === 'doing') doingTasks++;
          if (isOverdue(task)) overdueActive++;
        }
      }
    }

    const completionRate = totalCreatedOrAssigned > 0 
      ? Math.round((completedTasks / totalCreatedOrAssigned) * 100) 
      : 0;

    // Derived Improvement Areas based on user request
    let improvementArea = "";
    if (completionRate >= 70) {
      improvementArea = "Continue assim! Seu fluxo está ótimo";
    } else if (completionRate >= 50) {
      improvementArea = "Que tal rever a sua maneira de fazer as coisas? Pedir ajuda é sempre bom! Converse com seus colegas, troque experiências.";
    } else {
      improvementArea = "O que está havendo? Vamos analisar todo o seu fluxo? As vezes é preciso dar 1 passo para tras para dar 2 para frente.";
    }

    return {
      total: totalCreatedOrAssigned,
      completed: completedTasks,
      overdue: overdueActive,
      rate: completionRate,
      advice: improvementArea
    };
  }, [columns, currentUser]);

  if (!currentUser || !metrics) return null;

  return (
    <div className="w-[400px] shrink-0 h-full flex flex-col gap-4 overflow-y-auto px-4 pb-6 scrollbar-none">
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 shadow-xl shadow-black/20 border border-white/10 sticky top-0">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Meu Desempenho</h3>
            <p className="text-[10px] text-slate-400 font-medium">Resumo do período</p>
          </div>
        </div>

        {/* Progress Circle & Rate */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-28 h-28 mb-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-slate-100 stroke-current"
                strokeWidth="8"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
              />
              <circle
                className="text-indigo-500 stroke-current drop-shadow-md transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeLinecap="round"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - metrics.rate / 100)}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">{metrics.rate}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Concluído</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#1e2336] rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center gap-1.5 mb-1 text-emerald-500">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Entregues</span>
            </div>
            <p className="text-lg font-black text-white leading-none">{metrics.completed}</p>
          </div>
          
          <div className="bg-rose-950/20 rounded-xl p-3 border border-rose-900/50">
             <div className="flex items-center gap-1.5 mb-1 text-rose-500">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Atrasos</span>
            </div>
            <p className="text-lg font-black text-rose-400 leading-none">{metrics.overdue}</p>
          </div>
        </div>

        {/* AI Insight Box */}
        <div className="bg-indigo-950/30 rounded-xl p-4 border border-indigo-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-linear-to-bl from-indigo-500/20 to-transparent rounded-bl-full" />
          
          <h4 className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 mb-2">
            ✨ Análise Ataretivos
          </h4>
          <p className="text-[11px] font-medium text-indigo-200/80 leading-relaxed">
            {metrics.advice}
          </p>
        </div>

      </div>
    </div>
  );
}

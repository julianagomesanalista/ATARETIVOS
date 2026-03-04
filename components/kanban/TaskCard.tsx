"use client";
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Clock, AlertTriangle } from 'lucide-react';
import { Task } from '@/types';
import { useKanban } from '@/context/KanbanContext';
import Avatar from './Avatar';
import {
  getTimeProgress,
  formatTimeLabel,
  getProgressBarColor,
  isOverdue,
  COMPLEXITY_LABELS,
} from '@/utils/sla';

interface TaskCardProps {
  task: Task;
  overlay?: boolean;
}

const COMPLEXITY_DOT: Record<string, string> = {
  facil: 'bg-blue-400',
  medio: 'bg-orange-400',
  dificil: 'bg-red-500',
};

export default function TaskCard({ task, overlay = false }: TaskCardProps) {
  const { setSelectedTask } = useKanban();
  const overdue = isOverdue(task);
  const showTimer = task.status !== 'done';

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled: overlay });



  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        if (el) {
          el.style.transform = CSS.Transform.toString(transform) || '';
          el.style.transition = transition || '';
          el.style.opacity = isDragging ? '0.35' : '1';
        }
      }}
      {...attributes}
      {...listeners}
      onClick={() => !overlay && setSelectedTask(task)}
      className={`bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10 cursor-grab active:cursor-grabbing select-none
        transition-all hover:shadow-lg hover:shadow-black/40 hover:border-white/20 shadow-md
        ${overdue && showTimer ? 'border-l-4 border-l-red-500' : ''}`}
    >
      {/* Top row: avatar + company */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar
            src={task.creator?.avatar_url}
            name={task.creator?.full_name}
            className="w-7 h-7 rounded-full shrink-0 border border-slate-700"
          />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
            {task.company_name || 'PROJETO'}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
          title="Ver detalhes"
          aria-label="Ver detalhes da tarefa"
          className="p-1 rounded-md hover:bg-[#2a3254] text-slate-400 shrink-0 hover:text-slate-200 transition-colors"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-slate-200 leading-snug mb-3 line-clamp-2">
        {task.title}
      </h3>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag) => (
            <span
              key={tag.name}
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wide ${tag.color}`}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer: complexity + comments count */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${COMPLEXITY_DOT[task.complexity]}`} />
        <span className="text-[10px] text-slate-400">{COMPLEXITY_LABELS[task.complexity]}</span>
        {task.comments.length > 0 && (
          <span className="ml-auto text-[10px] text-slate-400">{task.comments.length} 💬</span>
        )}
      </div>

      {/* Time bar â€” only for todo / doing */}
      {showTimer && (
        <div className="border-t border-slate-700/50 pt-2.5">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1">
              {overdue ? (
                <AlertTriangle className="w-3 h-3 text-red-500" />
              ) : (
                <Clock className="w-3 h-3 text-slate-400" />
              )}
              <span suppressHydrationWarning className={`text-[10px] font-medium ${overdue ? 'text-red-400' : 'text-slate-400'}`}>
                {formatTimeLabel(task)}
              </span>
            </div>
            <span suppressHydrationWarning className="text-[10px] text-slate-400">{Math.round(getTimeProgress(task))}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
            <div
              suppressHydrationWarning
              className={`h-full rounded-full transition-all ${getProgressBarColor(task)}`}
              ref={(el) => { if (el) el.style.width = `${getTimeProgress(task)}%`; }}
            />
          </div>
        </div>
      )}

      {/* Done badge */}
      {task.status === 'done' && (
        <div className="border-t border-slate-700/50 pt-2.5">
          <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
            ✅ Concluído
          </span>
        </div>
      )}
    </div>
  );
}

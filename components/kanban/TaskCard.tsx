"use client";
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Clock, AlertTriangle } from 'lucide-react';
import { Task } from '@/types';
import { useKanban } from '@/context/KanbanContext';
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !overlay && setSelectedTask(task)}
      className={`bg-white rounded-xl p-4 border border-slate-100 cursor-grab active:cursor-grabbing select-none
        transition-shadow hover:shadow-card-hover shadow-card
        ${overdue && showTimer ? 'border-l-4 border-l-red-400' : ''}`}
    >
      {/* Top row: avatar + company */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={task.creator?.avatar_url}
            alt={task.creator?.full_name}
            className="w-7 h-7 rounded-full border border-slate-200 flex-shrink-0"
            draggable={false}
          />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
            {task.company_name || 'PROJETO'}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
          title="Ver detalhes"
          aria-label="Ver detalhes da tarefa"
          className="p-1 rounded-md hover:bg-slate-100 text-slate-400 flex-shrink-0"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-slate-800 leading-snug mb-3 line-clamp-2">
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
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${COMPLEXITY_DOT[task.complexity]}`} />
        <span className="text-[10px] text-slate-400">{COMPLEXITY_LABELS[task.complexity]}</span>
        {task.comments.length > 0 && (
          <span className="ml-auto text-[10px] text-slate-400">{task.comments.length} ðŸ’¬</span>
        )}
      </div>

      {/* Time bar â€” only for todo / doing */}
      {showTimer && (
        <div className="border-t border-slate-100 pt-2.5">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1">
              {overdue ? (
                <AlertTriangle className="w-3 h-3 text-red-500" />
              ) : (
                <Clock className="w-3 h-3 text-slate-400" />
              )}
              <span className={`text-[10px] font-medium ${overdue ? 'text-red-500' : 'text-slate-500'}`}>
                {formatTimeLabel(task)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">{Math.round(getTimeProgress(task))}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getProgressBarColor(task)}`}
              style={{ width: `${getTimeProgress(task)}%` }}
            />
          </div>
        </div>
      )}

      {/* Done badge */}
      {task.status === 'done' && (
        <div className="border-t border-slate-100 pt-2.5">
          <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
            âœ“ ConcluÃ­do
          </span>
        </div>
      )}
    </div>
  );
}

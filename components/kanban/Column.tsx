"use client";
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { KanbanColumn } from '@/types';
import { useKanban } from '@/context/KanbanContext';
import TaskCard from './TaskCard';

interface ColumnProps {
  column: KanbanColumn;
}

export default function Column({ column }: ColumnProps) {
  const { setShowCreateModal } = useKanban();
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-t-xl"
        style={{ backgroundColor: column.headerColor }}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white tracking-wide">{column.title}</h2>
          <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {column.tasks.length}
          </span>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-6 h-6 rounded-md bg-white/20 hover:bg-white/35 flex items-center justify-center text-white transition-colors"
          title="Adicionar tarefa"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-b-xl p-3 transition-colors overflow-y-auto scrollbar-thin min-h-[400px] ${
          isOver ? 'drop-active' : 'bg-slate-100'
        }`}
      >
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {column.tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>

        {column.tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <span className="text-3xl mb-2">âœ¦</span>
            <p className="text-xs">Arraste um card aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}

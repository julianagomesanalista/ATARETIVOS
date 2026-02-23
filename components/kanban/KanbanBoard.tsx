"use client";
import React, { useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useState } from 'react';
import { Status, Task } from '@/types';
import { useKanban } from '@/context/KanbanContext';
import Column from './Column';
import TaskCard from './TaskCard';

export default function KanbanBoard() {
  const { columns, moveTask } = useKanban();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = columns
      .flatMap((c) => c.tasks)
      .find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }, [columns]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);
      if (!over) return;

      const taskId = active.id as string;
      // over could be a column id (Status) or another task id
      const overId = over.id as string;

      // Determine target column
      const statusIds: Status[] = ['todo', 'doing', 'done'];
      let targetStatus: Status | undefined;

      if (statusIds.includes(overId as Status)) {
        targetStatus = overId as Status;
      } else {
        // over is a task â€” find its column
        const col = columns.find((c) => c.tasks.some((t) => t.id === overId));
        targetStatus = col?.id;
      }

      if (targetStatus) moveTask(taskId, targetStatus);
    },
    [columns, moveTask]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-5 h-full min-w-max">
        {columns.map((col) => (
          <Column key={col.id} column={col} />
        ))}
      </div>

      {/* Drag overlay â€” ghost card */}
      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 card-drag-shadow opacity-90">
            <TaskCard task={activeTask} overlay />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

"use client";
import React, { useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { useState, useEffect } from 'react';
import { Status, Task } from '@/types';
import { useKanban } from '@/context/KanbanContext';
import Column from './Column';
import TaskCard from './TaskCard';
import FloatingChatContainer from './FloatingChatContainer';

export default function KanbanBoard() {
  const { columns, moveTask, chatTabs, setChatDraft, setChatMention } = useKanban();
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
      const overId = over.id as string;

      // Handle dragging task onto a chat (overId: 'chat-<tabId>')
      if (overId.startsWith('chat-')) {
        const tabId = overId.replace('chat-', '');
        const tab = chatTabs.find(t => t.id === tabId);
        
        // Find the task because active.id gives the task id
        const taskObj = columns.flatMap((c) => c.tasks).find((t) => t.id === taskId);
        
        if (tab && taskObj) {
          setChatMention(tabId, { taskId: taskObj.id, title: taskObj.title });
        }
        return;
      }

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
    [columns, moveTask, chatTabs, setChatDraft, setChatMention]
  );

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    // defer state update to avoid cascading render warning
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 flex gap-5 h-full min-w-max pr-6">
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

      {/* Floating Chat Container needs to be inside DndContext to receive drops */}
      <FloatingChatContainer />
    </DndContext>
  );
}

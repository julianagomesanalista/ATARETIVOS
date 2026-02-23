"use client";
import React, { useState } from 'react';
import Navbar from '@/components/kanban/Navbar';
import Sidebar from '@/components/kanban/Sidebar';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import ChatPanel from '@/components/kanban/ChatPanel';
import CreateTaskModal from '@/components/kanban/CreateTaskModal';
import TaskDetailModal from '@/components/kanban/TaskDetailModal';
import AdminUserManagement from './AdminUserManagement';
import ReportsPanel from './ReportsPanel';
import { useKanban } from '@/context/KanbanContext';

export type TabType = 'board' | 'team' | 'reports';

export default function BoardPage() {
  const { showCreateModal, selectedTask, showChat } = useKanban();
  const [activeTab, setActiveTab] = useState<TabType>('board');

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />

        {/* Main area conditional render */}
        <main className="flex-1 overflow-hidden flex bg-[#1e2336]">
          {activeTab === 'board' && (
            <>
              <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-slate-50">
                <KanbanBoard />
              </div>

              {/* Chat panel */}
              {showChat && (
                <div className="w-80 flex-shrink-0 border-l border-slate-200 bg-slate-900 overflow-hidden">
                  <ChatPanel />
                </div>
              )}
            </>
          )}

          {activeTab === 'team' && (
            <div className="flex-1 overflow-y-auto w-full bg-slate-50">
              <AdminUserManagement />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="flex-1 overflow-y-auto w-full">
              <ReportsPanel />
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showCreateModal && <CreateTaskModal />}
      {selectedTask && <TaskDetailModal />}
    </div>
  );
}

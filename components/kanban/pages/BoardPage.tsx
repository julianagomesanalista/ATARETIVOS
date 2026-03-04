"use client";
import React, { useState } from 'react';
import Navbar from '@/components/kanban/Navbar';
import Sidebar, { TabType } from '@/components/kanban/Sidebar';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import UserEvolutionBoard from '@/components/kanban/UserEvolutionBoard';
import CreateTaskModal from '@/components/kanban/CreateTaskModal';
import TaskDetailModal from '@/components/kanban/TaskDetailModal';
import AdminUserManagement from './AdminUserManagement';
import ReportsPanel from './ReportsPanel';
import IdeasPanel from './IdeasPanel';
import ConfigPanel from './ConfigPanel';
import { useKanban } from '@/context/KanbanContext';
import { useAuth } from '@/context/AuthContext';



export default function BoardPage() {
  const { showCreateModal, selectedTask } = useKanban();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('board');

  const hasCustomBg = !!currentUser?.background_url;
  const mainStyle = hasCustomBg 
    ? { backgroundImage: `url(${currentUser.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" suppressHydrationWarning>
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content */}
      <div id="board-main" className={`flex flex-col flex-1 min-w-0 overflow-hidden relative ${hasCustomBg ? '' : 'bg-[#1e2336]'}`} style={mainStyle} suppressHydrationWarning>
        {hasCustomBg && (
          <div className="absolute inset-0 bg-black/40 pointer-events-none z-0" />
        )}
        
        <div className="relative z-10 flex flex-col w-full h-full">
          <div className="relative z-50">
            <Navbar />
          </div>

          {/* Main area conditional render */}
          <main className={`flex-1 overflow-hidden flex relative z-0 ${hasCustomBg ? 'bg-transparent' : 'bg-[#1e2336]'}`} suppressHydrationWarning>
            {activeTab === 'board' && (
              <>
                <div className={`flex-1 overflow-x-auto overflow-y-hidden p-6 flex gap-6 ${hasCustomBg ? 'bg-transparent' : 'bg-[#1e2336]'}`} suppressHydrationWarning>
                  <div className="flex shrink-0" suppressHydrationWarning>
                    <KanbanBoard />
                  </div>
                  <div className="flex-1 flex justify-center items-start min-w-[380px] h-full overflow-y-auto pt-4" suppressHydrationWarning>
                    <UserEvolutionBoard />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'team' && (
              <div className={`flex-1 overflow-y-auto w-full ${hasCustomBg ? 'bg-transparent' : 'bg-slate-50'}`}>
                <AdminUserManagement />
              </div>
            )}

            {activeTab === 'reports' && (
              <div className={`flex-1 overflow-y-auto w-full scrollbar-thin ${hasCustomBg ? 'bg-transparent' : 'bg-slate-50'}`}>
                <ReportsPanel />
              </div>
            )}

            {activeTab === 'ideas' && (
              <div className={`flex-1 overflow-y-auto w-full scrollbar-thin ${hasCustomBg ? 'bg-transparent' : 'bg-[#1e2336]'}`}>
                <IdeasPanel />
              </div>
            )}

            {activeTab === 'config' && (
              <div className={`flex-1 overflow-y-auto w-full ${hasCustomBg ? 'bg-transparent' : 'bg-[#1e2336]'}`}>
                <ConfigPanel />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modals & Floating Components */}
      {showCreateModal && <CreateTaskModal />}
      {selectedTask && <TaskDetailModal />}
    </div>
  );
}

"use client";
import React from 'react';
import { LayoutDashboard, Users, BarChart2, Settings, Lightbulb } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Avatar from './Avatar';

export type TabType = 'board' | 'team' | 'reports' | 'ideas' | 'config';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { currentUser } = useAuth();

  const roleColors: Record<string, string> = {
    admin: 'bg-red-500',
    master: 'bg-amber-500',
    gestor: 'bg-indigo-500',
    user: 'bg-blue-500',
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Board', id: 'board' as TabType, show: true },
    { icon: Users, label: 'Equipe', id: 'team' as TabType, show: currentUser?.role === 'admin' },
    { icon: BarChart2, label: 'Relatórios', id: 'reports' as TabType, show: true },
    { icon: Lightbulb, label: 'Ideias', id: 'ideas' as TabType, show: true },
    { icon: Settings, label: 'Config', id: 'config' as TabType, show: true },
  ];

  return (
    <aside className="w-16 bg-slate-900 flex flex-col items-center py-4 gap-2 shrink-0 border-r border-slate-800 z-50" suppressHydrationWarning>
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/20 mb-6" suppressHydrationWarning>
        <span className="text-xl">📋</span>
      </div>

      <div className="w-8 h-px bg-slate-700 mb-2" />

      {/* Nav icons */}
      {navItems.filter(i => i.show).map(({ icon: Icon, label, id }) => {
        const active = id === activeTab;
        return (
          <button
            key={id}
            title={label}
            onClick={() => onTabChange(id as TabType)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Icon className="w-5 h-5" />
          </button>
        );
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Role badge + avatar */}
      <div className="relative">
        <Avatar
          src={currentUser?.avatar_url}
          name={currentUser?.full_name}
          className="w-10 h-10 border-2 border-slate-700 rounded-full overflow-hidden"
        />
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
            roleColors[currentUser?.role || 'user']
          }`}
        />
      </div>
    </aside>
  );
}

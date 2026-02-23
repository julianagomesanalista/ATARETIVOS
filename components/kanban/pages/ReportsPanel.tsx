"use client";
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { mockTasks } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ReportsPanel() {
  const { availableUsers } = useAuth();
  
  // Status Distribution (Pie Chart)
  const statusData = useMemo(() => {
    const todo = mockTasks.filter(t => t.status === 'todo').length;
    const doing = mockTasks.filter(t => t.status === 'doing').length;
    const done = mockTasks.filter(t => t.status === 'done').length;
    return [
      { name: 'Feito', value: done, color: '#10b981' }, // emerald-500
      { name: 'Em andamento', value: doing, color: '#f59e0b' }, // amber-500
      { name: 'Parado', value: todo, color: '#ef4444' }, // red-500
    ];
  }, []);

  // Performance / Workload line chart mock
  const burndownData = [
    { name: 'Seg', val1: 30, val2: 28, val3: 32 },
    { name: 'Ter', val1: 25, val2: 24, val3: 27 },
    { name: 'Qua', val1: 20, val2: 22, val3: 20 },
    { name: 'Qui', val1: 15, val2: 12, val3: 15 },
    { name: 'Sex', val1: 10, val2: 8, val3: 10 },
  ];

  // User Workload / Ranking
  const userStats = useMemo(() => {
    return availableUsers.map(u => {
      const userTasks = mockTasks.filter(t => t.assignee?.id === u.id);
      const done = userTasks.filter(t => t.status === 'done').length;
      const doing = userTasks.filter(t => t.status === 'doing').length;
      const todo = userTasks.filter(t => t.status === 'todo').length;
      return { user: u, done, doing, todo, total: done + doing + todo };
    }).sort((a, b) => b.done - a.done); // Ranking by most "done"
  }, [availableUsers]);

  return (
    <div className="w-full h-full bg-[#1e2336] p-8 text-white select-none overflow-y-auto overflow-x-hidden">
      <h1 className="text-3xl font-bold mb-8 text-white">Sprint 127</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full max-w-7xl">
        {/* Status PieChart */}
        <div className="bg-[#242b42] rounded-2xl border border-slate-700/50 p-6 flex flex-col items-center">
          <h2 className="text-lg font-medium text-slate-300 mb-4 w-full text-left">Status</h2>
          <div className="h-48 w-full relative pl-6 flex justify-center items-center">
            <ResponsiveContainer width="70%" height="105%" className="-ml-12">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e2336', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom Legend */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-3">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Burndown Chart */}
        <div className="bg-[#242b42] rounded-2xl border border-slate-700/50 p-6 flex flex-col">
          <h2 className="text-lg font-medium text-slate-300 mb-4 text-center">GrÃ¡fico de burndown</h2>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burndownData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}SP`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e2336', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="val1" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="val2" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="val3" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Workload / Ranking */}
        <div className="bg-[#242b42] rounded-2xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-medium text-slate-300 mb-6 text-center">Volume de trabalho</h2>
          <div className="flex flex-col gap-4">
            {userStats.slice(0, 4).map(({ user, done, doing, todo }) => (
              <div key={user.id} className="flex items-center justify-between border-b border-slate-700/50 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3 w-[45%]">
                  <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full border border-slate-600" />
                  <span className="text-sm font-medium truncate" title={user.full_name}>{user.full_name.split(' ')[0]}</span>
                </div>
                <div className="flex gap-2 w-[55%] justify-end items-center px-2">
                   {/* Visualization limit dots up to 3 for clean UI */}
                   {Array.from({length: Math.min(done, 3)}).map((_, i) => (
                      <span key={`done-${i}`} className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                         <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                         </svg>
                      </span>
                   ))}
                   {Array.from({length: Math.min(doing, 3)}).map((_, i) => (
                      <span key={`doing-${i}`} className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                         <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      </span>
                   ))}
                   {Array.from({length: Math.min(todo, 3)}).map((_, i) => (
                      <span key={`todo-${i}`} className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      </span>
                   ))}
                   {todo + doing + done === 0 && <span className="text-xs text-slate-500 italic">Sem tarefas</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sprint Management Table */}
      <div className="bg-[#242b42] rounded-2xl border border-slate-700/50 overflow-hidden max-w-7xl">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-xl font-medium text-slate-300">GestÃ£o do sprint</h2>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1e2439] border-b border-slate-700/50 text-slate-400 text-sm">
              <th className="py-4 px-6 font-medium">Sprint 127</th>
              <th className="py-4 px-6 font-medium text-center">Resp.</th>
              <th className="py-4 px-6 font-medium text-center w-48">Cronograma</th>
              <th className="py-4 px-6 font-medium text-center">Data</th>
              <th className="py-4 px-0 font-medium text-center w-40">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {mockTasks.slice(0, 5).map((task, idx) => {
               // Assignee fallback
               const resp = task.assignee || availableUsers[idx % availableUsers.length];
               
               let statusColor = 'hover:bg-slate-700/50 text-slate-400';
               let statusLabel = 'A FAZER';
               let pColor = 'bg-red-500';
               let pWidth = '20%';

               if (task.status === 'done') {
                 statusColor = 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20';
                 statusLabel = 'Feito';
                 pColor = 'bg-emerald-500';
                 pWidth = '100%';
               } else if (task.status === 'doing') {
                 statusColor = 'bg-amber-500 text-white shadow-lg shadow-amber-500/20';
                 statusLabel = 'Em andamento';
                 pColor = 'bg-purple-500'; // purple looks great for "doing bar" in this dark style
                 pWidth = '60%';
               } else {
                 statusColor = 'text-slate-400';
               }

               return (
                 <tr key={task.id} className="hover:bg-[#2a324a] transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                         {/* Optional colored left border indicator logic? A red pipe for todo... */}
                         <div className={`w-1 h-10 rounded-full ${task.status === 'todo' ? 'bg-red-400' : 'bg-transparent'}`}></div>
                         <span className="text-slate-200 text-[15px] font-medium tracking-wide">{task.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <img 
                          src={resp.avatar_url} 
                          alt={resp.full_name} 
                          className="w-8 h-8 rounded-full border border-slate-600 group-hover:border-slate-400 transition-colors" 
                          title={resp.full_name}
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center items-center w-full">
                         <div className="w-32 h-2.5 bg-[#161a29] rounded-full overflow-hidden border border-slate-700/50">
                           <div className={`h-full ${pColor} rounded-full transition-all duration-500`} style={{ width: pWidth }}></div>
                         </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-400 text-center">
                      {format(new Date(task.due_date), "d MMM", { locale: ptBR })}
                    </td>
                    <td className={`p-0 text-center align-middle font-bold text-sm h-16`}>
                      <div className={`h-full flex items-center justify-center tracking-wider w-full ${statusColor}`}>
                        {statusLabel}
                      </div>
                    </td>
                 </tr>
               );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

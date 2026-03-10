"use client";
import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { useKanban } from '@/context/KanbanContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Task } from '@/types';

// ── Paleta de cores para as barras de carga ───────────────────────────────────
const BAR_COLORS = ['#64748b', '#f97316', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#14b8a6'];

// ── Sub-componente: Painel de Carga / Ranking ─────────────────────────────────
function WorkloadPanel({ users, tasks, title, subtitle }: { users: User[]; tasks: Task[]; title: string; subtitle?: string }) {
  const stats = useMemo(() => {
    const raw = users.map((u) => {
      // Use creator_id as the task owner (since assignee is not populated)
      const userTasks = tasks.filter((t) => t.creator_id === u.id);
      const done  = userTasks.filter((t) => t.status === 'done').length;
      const doing = userTasks.filter((t) => t.status === 'doing').length;
      const todo  = userTasks.filter((t) => t.status === 'todo').length;
      return { user: u, done, doing, todo, total: done + doing + todo };
    });
    const grandTotal = raw.reduce((s, r) => s + r.total, 0);
    return raw
      .map((r, i) => ({
        ...r,
        pct: grandTotal > 0 ? Math.round((r.total / grandTotal) * 100) : 0,
        color: BAR_COLORS[i % BAR_COLORS.length],
      }))
      .sort((a, b) => b.total - a.total);
  }, [users, tasks]);

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6 flex flex-col">
      <h2 className="text-lg font-semibold text-white mb-1">{title}</h2>
      {subtitle && <p className="text-xs text-slate-400 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}

      {/* Header */}
      <div className="grid grid-cols-[1fr_2fr_2rem] gap-3 text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-3 px-1">
        <span>Responsável</span>
        <span>Distribuição do trabalho</span>
        <span className="text-right">Qt.</span>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-3.5 overflow-y-auto max-h-52 pr-1">
        {stats.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-6">Nenhum usuário encontrado.</p>
        )}
        {stats.map(({ user, total, pct, color }) => (
          <div key={user.id} className="grid grid-cols-[1fr_2fr_2rem] gap-3 items-center">
            {/* Usuário */}
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`}
                alt={user.full_name}
                className="w-7 h-7 rounded-full border border-slate-600 flex-shrink-0"
              />
              <span className="text-sm text-slate-200 truncate">{user.full_name.split(' ')[0]}</span>
            </div>

            {/* Barra + % */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2.5 bg-[#161a29] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <span className="text-[11px] text-slate-400 w-7 text-right">{pct}%</span>
            </div>

            {/* Contagem */}
            <span className="text-sm font-bold text-white text-right">{total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sub-componente: Histórico de Atividades (para usuários comuns) ─────────────
function ActivityHistory({ userId, tasks }: { userId: string; tasks: Task[] }) {
  const myTasks = useMemo(() => {
    return tasks
      .filter((t) => t.creator_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [userId, tasks]);

  const statusInfo = (s: string) => {
    if (s === 'done')  return { label: 'Concluída',    dot: 'bg-emerald-400', badge: 'text-emerald-400 bg-emerald-400/10' };
    if (s === 'doing') return { label: 'Em andamento', dot: 'bg-amber-400',   badge: 'text-amber-400 bg-amber-400/10' };
    return               { label: 'Pendente',       dot: 'bg-slate-500',   badge: 'text-slate-400 bg-slate-700/40' };
  };

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6 col-span-full">
      <h2 className="text-lg font-semibold text-white mb-1">Histórico de Atividades</h2>
      <p className="text-xs text-slate-400 mb-5">Seu progresso recente nas tarefas atribuídas a você.</p>

      <div className="flex flex-col divide-y divide-slate-700/30">
        {myTasks.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">Nenhuma atividade encontrada.</p>
        )}
        {myTasks.map((task) => {
          const si = statusInfo(task.status);
          return (
            <div
              key={task.id}
              className="py-3.5 flex items-center gap-4 hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${si.dot}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 font-medium truncate">{task.title}</p>
                {task.company_name && (
                  <p className="text-[11px] text-slate-500 mt-0.5">{task.company_name}</p>
                )}
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${si.badge}`}>
                {si.label}
              </span>
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {format(new Date(task.created_at), "d MMM", { locale: ptBR })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────
export default function ReportsPanel() {
  const { currentUser, availableUsers } = useAuth();
  const { tasks } = useKanban();

  const role = currentUser?.role ?? 'user';
  const isAdminOrMaster = role === 'admin' || role === 'master';
  const isGestor        = role === 'gestor';
  const isUser          = role === 'user';

  // Donut de status — para gestor, filtrado pela área dele
  const statusData = useMemo(() => {
    let currentTasks = tasks;
    if (isGestor && currentUser?.area) {
      const areaIds = availableUsers.filter((u) => u.area === currentUser.area).map((u) => u.id);
      currentTasks = tasks.filter((t) => areaIds.includes(t.creator_id));
    }
    return [
      { name: 'Feito',        value: currentTasks.filter((t) => t.status === 'done').length,  color: '#10b981' },
      { name: 'Em andamento', value: currentTasks.filter((t) => t.status === 'doing').length, color: '#f59e0b' },
      { name: 'Parado',       value: currentTasks.filter((t) => t.status === 'todo').length,  color: '#ef4444' },
    ];
  }, [isGestor, currentUser, availableUsers, tasks]);

  // Gráfico de barras (Produtividade por Área) — para admin/master
  const areaStats = useMemo(() => {
    const areas = ['Comercial', 'Tecnologia', 'Jurídico', 'Hunters', 'Marketing'];
    return areas.map((area) => {
      const uids = availableUsers.filter((u) => u.area === area).map((u) => u.id);
      // Use creator_id as task owner
      const aT   = tasks.filter((t) => uids.includes(t.creator_id));
      return {
        name: area,
        'Feito':        aT.filter((t) => t.status === 'done').length,
        'Em Andamento': aT.filter((t) => t.status === 'doing').length,
        'A Fazer':      aT.filter((t) => t.status === 'todo').length,
      };
    });
  }, [availableUsers, tasks]);

  // Usuários da área do gestor (para o painel de carga)
  const gestorAreaUsers = useMemo(() => {
    if (!currentUser?.area) return availableUsers;
    return availableUsers.filter((u) => u.area === currentUser.area);
  }, [currentUser, availableUsers]);

  // Tarefas visíveis na tabela Sprint (filtradas por role)
  const sprintTasks = useMemo(() => {
    if (isUser) {
      return tasks.filter((t) => t.creator_id === currentUser?.id);
    }
    if (isGestor && currentUser?.area) {
      const areaIds = availableUsers.filter((u) => u.area === currentUser.area).map((u) => u.id);
      return tasks.filter((t) => areaIds.includes(t.creator_id));
    }
    return tasks;
  }, [isUser, isGestor, currentUser, availableUsers, tasks]);

  const hasCustomBg = !!currentUser?.background_url;

  return (
    <div className={`w-full p-8 min-h-full h-fit text-white select-none flex flex-col items-center ${hasCustomBg ? 'bg-transparent' : 'bg-[#1e2336]'}`}>
      <div className="w-full max-w-6xl flex justify-center mb-8">
        <h1 className="text-3xl font-bold text-white tracking-wide">
          Olá, {currentUser?.full_name?.split(' ')[0] ?? 'bem-vindo'} 👋
        </h1>
      </div>

      {/* ── SEÇÃO PRINCIPAL: varia por role ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full max-w-6xl">

        {/* ─── GESTOR: Resumo do status + Carga de trabalho da equipe ─── */}
        {isGestor && (
          <>
            {/* Donut - Resumo do status */}
            <div className="bg-black/40 backdrop-blur-md shadow-xl rounded-2xl border border-white/10 p-6 flex flex-col">
              <h2 className="text-lg font-semibold text-white mb-1">Resumo do status</h2>
              <p className="text-xs text-slate-400 mb-4">
                Visão geral das tarefas da sua equipe.{' '}
                <span className="text-indigo-400 cursor-pointer hover:underline">Ver mais informações.</span>
              </p>
              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="45%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={58} outerRadius={84} dataKey="value" stroke="none">
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e2336', borderColor: '#334155', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legenda */}
                <div className="flex flex-col gap-3 ml-2">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-3 text-sm">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300 w-28">{item.name}</span>
                      <span className="font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 text-sm border-t border-slate-700/50 pt-2 mt-1">
                    <span className="w-3 h-3 flex-shrink-0" />
                    <span className="text-slate-400 w-28">Total</span>
                    <span className="font-bold text-white">{statusData.reduce((s, i) => s + i.value, 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Carga de trabalho da equipe */}
            <WorkloadPanel
              users={gestorAreaUsers}
              tasks={tasks}
              title="Carga de trabalho da equipe"
              subtitle={`Gerenciar capacidade da equipe — ${currentUser?.area ?? 'Sua área'}`}
            />
          </>
        )}

        {/* ─── ADMIN / SÓCIO (master): Produtividade por Área + Ranking ─── */}
        {isAdminOrMaster && (
          <>
            {/* Produtividade por Área */}
            <div className="bg-black/40 backdrop-blur-md shadow-xl rounded-2xl border border-white/10 p-6 flex flex-col">
              <h2 className="text-lg font-semibold text-white mb-1">Produtividade por Área</h2>
              <p className="text-xs text-slate-400 mb-4">Distribuição de tarefas entre as áreas da empresa.</p>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={areaStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e2336', borderColor: '#334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{ fill: '#ffffff08' }}
                    />
                    <Bar dataKey="Feito"        stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Em Andamento" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="A Fazer"      stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Legenda inline */}
              <div className="flex items-center gap-5 mt-3 justify-center">
                {[{ c: '#10b981', l: 'Feito' }, { c: '#f59e0b', l: 'Em andamento' }, { c: '#ef4444', l: 'A fazer' }].map((x) => (
                  <div key={x.l} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: x.c }} />
                    {x.l}
                  </div>
                ))}
              </div>
            </div>

            {/* Ranking de Usuários */}
            <WorkloadPanel
              users={availableUsers}
              tasks={tasks}
              title="Ranking de Usuários"
              subtitle="Distribuição geral de carga de trabalho por colaborador"
            />
          </>
        )}

        {/* ─── USUÁRIO COMUM: Histórico de Atividades ─── */}
        {isUser && currentUser && (
          <ActivityHistory userId={currentUser.id} tasks={tasks} />
        )}
      </div>

      {/* ── TABELA SPRINT ──────────────────────────────────────────────────────── */}
      <div className="bg-black/40 backdrop-blur-md shadow-xl rounded-2xl border border-white/10 overflow-hidden w-full max-w-6xl">
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-xl font-medium text-slate-300">
            {isUser ? 'Minhas Tarefas' : 'Gestão do Sprint'}
          </h2>
          <span className="text-xs text-slate-500 bg-slate-700/40 px-3 py-1 rounded-full">
            {sprintTasks.length} {sprintTasks.length === 1 ? 'tarefa' : 'tarefas'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-black/40 backdrop-blur-md border-b border-white/10 text-slate-400 text-sm">
              <th className="py-4 px-6 font-medium">Tarefa</th>
              <th className="py-4 px-6 font-medium text-center">Resp.</th>
              <th className="py-4 px-6 font-medium text-center w-48">Cronograma</th>
              <th className="py-4 px-6 font-medium text-center">Data</th>
              <th className="py-4 px-0 font-medium text-center w-40" aria-label="Status da tarefa">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {sprintTasks.map((task, idx) => {
              const resp = task.assignee || availableUsers[idx % Math.max(availableUsers.length, 1)];

              let statusColor = 'text-slate-400';
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
                pColor = 'bg-purple-500';
                pWidth = '60%';
              }

              return (
                <tr key={task.id} className="hover:bg-white/5 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-1 h-10 rounded-full ${task.status === 'todo' ? 'bg-red-400' : 'bg-transparent'}`} />
                      <span className="text-slate-200 text-[15px] font-medium tracking-wide">{task.title}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center">
                      {resp ? (
                        <img
                          src={resp.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(resp.full_name)}&background=random`}
                          alt={resp.full_name}
                          className="w-8 h-8 rounded-full border border-slate-600 group-hover:border-slate-400 transition-colors"
                          title={resp.full_name}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs">?</div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center items-center w-full">
                      <div className="w-32 h-2.5 bg-[#161a29] rounded-full overflow-hidden border border-slate-700/50">
                        <div
                          className={`h-full ${pColor} rounded-full transition-all duration-500`}
                          ref={(el) => { if (el) el.style.width = pWidth; }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-400 text-center">
                    {format(new Date(task.due_date), "d MMM", { locale: ptBR })}
                  </td>
                  <td className="p-0 text-center align-middle font-bold text-sm h-16">
                    <div className={`h-full flex items-center justify-center tracking-wider w-full ${statusColor}`}>
                      {statusLabel}
                    </div>
                  </td>
                </tr>
              );
            })}
            {sprintTasks.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                  Nenhuma tarefa encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, User, Search, Crown, Shield, ArrowLeft,
  CheckCircle2, AlertTriangle, Users, Briefcase
} from 'lucide-react';
import { Role, User as UserType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// â”€â”€â”€ Configuraá§á£o visual por Role â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ROLE_CONFIG: Record<Role, {
  label: string;
  icon: React.ElementType;
  badge: string;
  dot: string;
}> = {
  admin: {
    label: 'Administrador',
    icon: ShieldCheck,
    badge: 'bg-blue-100 text-blue-700 border border-blue-200',
    dot: 'bg-blue-500',
  },
  master: {
    label: 'Master',
    icon: Crown,
    badge: 'bg-amber-100 text-amber-700 border border-amber-200',
    dot: 'bg-amber-400',
  },
  gestor: {
    label: 'Gestor',
    icon: Briefcase,
    badge: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    dot: 'bg-indigo-400',
  },
  user: {
    label: 'Usuá¡rio',
    icon: User,
    badge: 'bg-slate-100 text-slate-500 border border-slate-200',
    dot: 'bg-slate-300',
  },
};

interface AdminPanelProps {
  onBack: () => void;
}

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const { availableUsers, currentUser, updateUserRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ name: string; role: Role } | null>(null);

  // Filtro de busca
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return availableUsers.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [availableUsers, searchTerm]);

  // Estatá­sticas rá¡pidas
  const stats = useMemo(() => ({
    total: availableUsers.length,
    admins: availableUsers.filter((u) => u.role === 'admin').length,
    masters: availableUsers.filter((u) => u.role === 'master').length,
    users: availableUsers.filter((u) => u.role === 'user').length,
  }), [availableUsers]);

  const handleRoleChange = async (user: UserType, newRole: Role) => {
    if (user.id === currentUser?.id) return;
    setUpdatingId(user.id);
    try {
      await updateUserRole(user.id, newRole);
      setToast({ name: user.full_name, role: newRole });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#1e2336]">
      {/* â”€â”€ Header â”€â”€ */}
      <header className="bg-[#1e2336] border-b border-slate-700/50 px-8 py-4 flex items-center gap-4 shrink-0">
        <button
          onClick={onBack}
          title="Voltar ao Quadro"
          aria-label="Voltar ao Quadro"
          className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900">Gestá£o de Equipe</h1>
            <p className="text-[11px] text-slate-400">Defina quem sá£o os Masters do G-Flow</p>
          </div>
        </div>

        {/* Busca */}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar colaborador..."
            title="Buscar colaborador"
            aria-label="Buscar colaborador"
            className="pl-9 pr-4 h-9 w-64 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-inner text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* â”€â”€ Cards de estatá­sticas â”€â”€ */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: Users, color: 'text-slate-600', bg: 'bg-slate-100' },
            { label: 'Admins', value: stats.admins, icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-100' },
            { label: 'Masters', value: stats.masters, icon: Crown, color: 'text-amber-600', bg: 'bg-amber-100' },
            { label: 'Usuá¡rios', value: stats.users, icon: User, color: 'text-slate-500', bg: 'bg-slate-100' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-xl flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800">{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* â”€â”€ Tabela de usuá¡rios â”€â”€ */}
        <div className="bg-black/40 backdrop-blur-md rounded-3xl shadow-xl border border-white/10 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-black/40 backdrop-blur-md border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  E-mail
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Membro desde
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Ná­vel de Acesso
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              <AnimatePresence initial={false}>
                {filtered.map((user) => {
                  const isMe = user.id === currentUser?.id;
                  const isUpdating = updatingId === user.id;
                  const cfg = ROLE_CONFIG[user.role];
                  const RoleIcon = cfg.icon;

                  return (
                    <motion.tr
                      key={user.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`transition-colors ${isMe ? 'bg-blue-600/10' : 'hover:bg-[#2a3254]'}`}
                    >
                      {/* Avatar + Nome */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <img
                              src={user.avatar_url}
                              alt={user.full_name}
                              className="w-10 h-10 rounded-full border-2 border-slate-700 shadow-sm"
                            />
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${cfg.dot}`}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                              {user.full_name}
                              {isMe && (
                                <span className="text-[9px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                                  Vocáª
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-sm text-slate-500">{user.email}</td>

                      {/* Data */}
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {format(new Date(user.created_at), "d MMM yyyy", { locale: ptBR })}
                      </td>

                      {/* Role selector */}
                      <td className="px-6 py-4">
                        {isMe ? (
                          /* Admin ná£o pode alterar o prá³prio role */
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${cfg.badge}`}>
                            <RoleIcon className="w-3 h-3" />
                            {cfg.label}
                            <span className="ml-1 text-[9px] opacity-60">(vocáª)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${cfg.badge}`}>
                              <RoleIcon className="w-3 h-3" />
                              {cfg.label}
                            </div>
                            <select
                              value={user.role}
                              disabled={isUpdating}
                              title={`Alterar ná­vel de ${user.full_name}`}
                              aria-label={`Alterar ná­vel de ${user.full_name}`}
                              onChange={(e) => handleRoleChange(user, e.target.value as Role)}
                              className="bg-[#1e2336] hover:bg-[#2a3254] border border-slate-700/50 rounded-xl text-xs font-bold px-3 py-1.5 text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <option value="user">Usuário Comum</option>
                              <option value="gestor">Gestor de Área</option>
                              <option value="master">Sócio — pode editar tudo</option>
                              <option value="admin">Admin — acesso total</option>
                            </select>
                            {isUpdating && (
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            )}
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-400 text-sm">
                    Nenhum colaborador encontrado para "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* â”€â”€ Legenda de roles â”€â”€ */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">
            Hierarquia de Acesso
          </p>
          <div className="grid grid-cols-3 gap-4">
            {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([role, cfg]) => {
              const Icon = cfg.icon;
              const descriptions: Record<Role, string[]> = {
                admin:  ['Acesso total ao sistema', 'Gerencia usuários e roles', 'Não pode ser editado por outros'],
                master: ['Edita e exclui qualquer tarefa', 'Edita e exclui qualquer comentário', 'Não acessa painel de usuários'],
                gestor: ['Visualiza relatórios da sua área', 'Vê carga de trabalho da equipe', 'Não acessa painel de admin'],
                user:   ['Cria e edita suas tarefas', 'Edita apenas seus comentários', 'Sem permissões especiais'],
              };

              return (
                <div key={role} className={`rounded-xl p-4 border ${cfg.badge.includes('blue') ? 'border-blue-100 bg-blue-50/50' : cfg.badge.includes('amber') ? 'border-amber-100 bg-amber-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-7 h-7 rounded-lg ${cfg.badge.includes('blue') ? 'bg-blue-100' : cfg.badge.includes('amber') ? 'bg-amber-100' : 'bg-slate-100'} flex items-center justify-center`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.badge.includes('blue') ? 'text-blue-600' : cfg.badge.includes('amber') ? 'text-amber-600' : 'text-slate-500'}`} />
                    </div>
                    <span className="text-xs font-black text-slate-700">{cfg.label}</span>
                  </div>
                  <ul className="space-y-1">
                    {descriptions[role].map((desc) => (
                      <li key={desc} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                        <CheckCircle2 className="w-3 h-3 text-slate-300 flex-shrink-0 mt-0.5" />
                        {desc}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* â”€â”€ Toast de confirmaá§á£o â”€â”€ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              <strong>{toast.name}</strong> agora á©{' '}
              <strong>{ROLE_CONFIG[toast.role].label}</strong>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

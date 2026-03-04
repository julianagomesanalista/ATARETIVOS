"use client";
import React, { useState } from 'react';
import { ShieldCheck, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';
import Avatar from '../Avatar';

const AdminUserManagement = () => {
  const { availableUsers, updateUserRole, currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  const hasCustomBg = !!currentUser?.background_url;

  const filteredUsers = availableUsers.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleLabels: Record<Role, string> = {
    admin: 'Admin (Acesso Total)',
    master: 'Sócio (Pode editar tudo)',
    gestor: 'Gestor de Área',
    user: 'Usuário Comum',
  };

  const roleBadgeColors: Record<Role, string> = {
    admin:  'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    master: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    gestor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    user:   'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  };

  return (
    <div className={`p-8 min-h-screen ${hasCustomBg ? 'bg-transparent' : 'bg-[#1e2336]'}`}>
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-white drop-shadow-md">Gestão de Equipe</h1>
            <p className="text-slate-200 text-sm mt-1 font-medium drop-shadow">Defina os níveis de acesso de cada colaborador</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              className="pl-10 pr-4 py-2 bg-black/40 backdrop-blur-md shadow-inner border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-black/40 backdrop-blur-md border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Colaborador</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-mail</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nível de Acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#2a3254] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar_url} name={user.full_name} className="w-9 h-9 rounded-full border border-slate-600" />
                      <div>
                        <p className="font-semibold text-slate-200 text-sm">{user.full_name}</p>
                        {user.area && <p className="text-[10px] text-slate-500 uppercase tracking-wider">{user.area}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${roleBadgeColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                      <select
                        value={user.role}
                        title={`Alterar nível de ${user.full_name}`}
                        aria-label={`Alterar nível de ${user.full_name}`}
                        onChange={(e) => updateUserRole(user.id, e.target.value as Role)}
                        className="bg-[#1e2336] border border-slate-700/50 rounded-lg text-xs text-slate-300 font-medium p-2 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:border-slate-500 transition-colors"
                      >
                        <option value="user">Usuário Comum</option>
                        <option value="gestor">Gestor de Área</option>
                        <option value="master">Sócio (Pode editar tudo)</option>
                        <option value="admin">Admin (Acesso Total)</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 text-sm">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;

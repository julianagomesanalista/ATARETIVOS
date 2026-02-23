"use client";
import React, { useState } from 'react';
import { ShieldCheck, User, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';

const AdminUserManagement = () => {
  const { availableUsers, updateUserRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = availableUsers.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">GestÃ£o de Equipe</h1>
            <p className="text-gray-500 text-sm">Defina quem sÃ£o os usuÃ¡rios Masters do G-Flow</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar colaborador..." 
              className="pl-10 pr-4 py-2 border-none rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Colaborador</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">E-mail</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">NÃ­vel de Acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img src={user.avatar_url || "https://via.placeholder.com/40"} className="w-10 h-10 rounded-full" alt="Avatar" />
                    <span className="font-bold text-gray-700">{user.full_name}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={user.role}
                      title={`Role of ${user.full_name}`}
                      aria-label={`Role of ${user.full_name}`}
                      onChange={(e) => updateUserRole(user.id, e.target.value as Role)}
                      className="bg-gray-100 border-none rounded-lg text-xs font-bold p-2 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="user">UsuÃ¡rio Comum</option>
                      <option value="master">Master (Pode editar tudo)</option>
                      <option value="admin">Admin (Acesso Total)</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                    Nenhum colaborador encontrado para "{searchTerm}"
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

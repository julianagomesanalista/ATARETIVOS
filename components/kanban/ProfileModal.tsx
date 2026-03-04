"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Shield, User as UserIcon, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Role, Area } from '@/types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { currentUser, canManageUsers, availableUsers, updateUserRole, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'admin'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !currentUser) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateUserProfile(currentUser.id, { avatar_url: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const AREAS: Area[] = ['Comercial', 'Tecnologia', 'Jurídico', 'Hunters', 'Marketing'];
  const ROLES: Role[] = ['user', 'master', 'admin'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Configurações da Conta
            </h2>
            <button
              onClick={onClose}
              title="Fechar Configurações"
              aria-label="Fechar Configurações"
              className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 px-6 pt-2 gap-6 bg-slate-50/50">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'profile' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Meu Perfil
              {activeTab === 'profile' && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
            {canManageUsers() && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-1.5 ${
                  activeTab === 'admin' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Shield className="w-4 h-4" />
                Gestão de Acessos
                {activeTab === 'admin' && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                )}
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            {activeTab === 'profile' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100">
                        {currentUser.avatar_url ? (
                          <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <UserIcon className="w-12 h-12" />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-2.5 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 hover:scale-105 transition-all group-hover:ring-4 ring-white"
                        title="Alterar foto"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        title="Fazer upload de foto"
                        aria-label="Fazer upload de foto"
                        className="hidden" 
                      />
                    </div>
                    <p className="text-xs text-slate-500 text-center max-w-[120px]">
                      Formatos aceitos: JPG, PNG.
                    </p>
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 space-y-4 w-full">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome Completo</label>
                      <div className="mt-1 font-medium text-slate-800 text-lg">{currentUser.full_name}</div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">E-mail</label>
                      <div className="mt-1 text-slate-600">{currentUser.email}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nível de Acesso</label>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
                            currentUser.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            currentUser.role === 'master' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {currentUser.role.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Área / Depto.</label>
                        <div className="mt-1">
                          {currentUser.area ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {currentUser.area}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-sm">Não definida</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900">Painel do Administrador</h3>
                    <p className="text-xs text-blue-700 mt-1">
                      Apenas administradores podem visualizar esta área e alterar o nível de acesso ou o departamento dos colaboradores.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                        <th className="px-4 py-3 font-medium">Colaborador</th>
                        <th className="px-4 py-3 font-medium">Área</th>
                        <th className="px-4 py-3 font-medium">Cargo (Nível)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {availableUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=random`} alt="" className="w-8 h-8 rounded-full" />
                              <div>
                                <div className="text-sm font-medium text-slate-800">{user.full_name}</div>
                                <div className="text-xs text-slate-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={user.area || ''}
                              onChange={(e) => updateUserProfile(user.id, { area: e.target.value as Area })}
                              title="Selecionar departamento"
                              aria-label="Selecionar departamento"
                              className="text-sm border-slate-200 rounded-md py-1.5 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                            >
                              <option value="" disabled>Selecione...</option>
                              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.id, e.target.value as Role)}
                              disabled={user.email === 'juliana.gomes081197@gmail.com' && currentUser.email !== 'juliana.gomes081197@gmail.com'}
                              title="Designar nível de acesso"
                              aria-label="Designar nível de acesso"
                              className="text-sm border-slate-200 rounded-md py-1.5 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              {ROLES.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

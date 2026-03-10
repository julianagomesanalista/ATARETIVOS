"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Shield, User as UserIcon, Settings, Trash2, ShieldAlert } from 'lucide-react';
import Cropper, { Area as CropArea } from 'react-easy-crop';
import { useAuth } from '@/context/AuthContext';
import { Role, Area } from '@/types';
import toast from 'react-hot-toast';

export default function ConfigPanel() {
  const { currentUser, canManageUsers, availableUsers, updateUserRole, updateUserProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'admin'>('profile');
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // Background Customization State
  const [selectedBg, setSelectedBg] = useState(currentUser?.background_url || '');
  const [isSavingBg, setIsSavingBg] = useState(false);

  React.useEffect(() => {
    const mainEl = document.getElementById('board-main');
    if (mainEl) {
      if (selectedBg) {
        mainEl.style.backgroundImage = `url('${selectedBg}')`;
        mainEl.classList.remove('bg-[#1e2336]');
      } else {
        mainEl.style.backgroundImage = 'none';
        if (!currentUser?.background_url) {
           mainEl.classList.add('bg-[#1e2336]');
        }
      }
    }
  }, [selectedBg, currentUser]);

  React.useEffect(() => {
    return () => {
      // Revert se sair sem salvar
      const mainEl = document.getElementById('board-main');
      if (mainEl && currentUser) {
         if (currentUser.background_url) {
           mainEl.style.backgroundImage = `url('${currentUser.background_url}')`;
           mainEl.classList.remove('bg-[#1e2336]');
         } else {
           mainEl.style.backgroundImage = 'none';
           mainEl.classList.add('bg-[#1e2336]');
         }
      }
    };
  }, [currentUser]);

  const handleSaveBackground = async () => {
    if (!currentUser) return;
    setIsSavingBg(true);
    await updateUserProfile(currentUser.id, { background_url: selectedBg });
    setIsSavingBg(false);
    toast.success('Tema atualizado com sucesso!');
  };

  if (!currentUser) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione um arquivo de imagem válido.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImgSrc(reader.result as string);
        setIsCropping(true);
        // Resetamos o input para permitir selecionar a mesma foto caso feche
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCrop = async () => {
    if (!croppedAreaPixels || !imgSrc) return;

    try {
      const image = new window.Image();
      image.src = imgSrc;
      
      await new Promise((resolve) => { image.onload = resolve; });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 400;
      canvas.height = 400;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        400,
        400
      );

      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
      updateUserProfile(currentUser.id, { avatar_url: compressedBase64 });
      
      setIsCropping(false);
      setImgSrc('');
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } catch (e) {
      console.error(e);
      toast.error('Erro ao recortar imagem');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("ATENÇÃO: Deseja realmente excluir sua conta? Esta ação apagará todas as suas tarefas e não poderá ser desfeita.")) return;
    
    setIsDeleting(true);
    try {
      // Importa supabase-js padrão usando as envs públicas já definidas
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { error } = await supabase.rpc('delete_user');
      
      if (error) {
        throw error;
      }
      
      toast.success("Conta excluída permanentemente.");
      logout();
      
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("Erro ao excluir conta:", error);
      toast.error("Ocorreu um erro ao excluir sua conta. Verifique se a função RPC foi criada no banco de dados.");
      setIsDeleting(false);
    }
  };

  const AREAS: Area[] = ['Comercial', 'Tecnologia', 'Jurídico', 'Hunters', 'Marketing'];
  const ROLES: Role[] = ['user', 'gestor', 'master', 'admin'];

  // Cores de badge
  const roleBadgeColors: Record<Role, string> = {
    admin:  'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    master: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    gestor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    user:   'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  };

  const isTransparent = !!selectedBg;

  return (
    <div className={`flex-1 overflow-y-auto w-full p-8 min-h-full ${isTransparent ? 'bg-transparent' : 'bg-[#1e2336]'}`}>
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3 drop-shadow-md">
              <Settings className="w-6 h-6 text-blue-500 drop-shadow" />
              Configurações da Conta
            </h1>
            <p className="text-slate-200 text-sm mt-1 font-medium drop-shadow">Gerencie seu perfil e as preferências da sua conta</p>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex mb-8 gap-8 bg-black/40 backdrop-blur-md px-6 pt-4 rounded-2xl border border-white/10 shadow-xl w-fit">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 text-sm font-semibold transition-colors relative ${
              activeTab === 'profile' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Meu Perfil
            {activeTab === 'profile' && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
            )}
          </button>
          
          {canManageUsers() && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`pb-4 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
                activeTab === 'admin' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              Gestão de Acessos
              {activeTab === 'admin' && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-xl flex flex-col md:flex-row gap-10 items-start">
                
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4 shrink-0">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full border-4 border-[#1e2336] shadow-xl overflow-hidden bg-slate-800">
                      {currentUser.avatar_url ? (
                        <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <UserIcon className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-500 hover:scale-105 transition-all group-hover:ring-4 ring-[#1e2336]"
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
                <div className="flex-1 space-y-6 w-full pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Completo</label>
                    <div className="mt-1 font-bold text-slate-200 text-xl">{currentUser.full_name}</div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail</label>
                    <div className="mt-1 text-slate-400 font-medium">{currentUser.email}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nível de Acesso</label>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${roleBadgeColors[currentUser.role]}`}>
                          {currentUser.role.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Área / Depto.</label>
                      <div className="mt-2">
                        {currentUser.area ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 tracking-wide">
                            {currentUser.area}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-sm">Não definida</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tema / Background Section */}
              <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-white/10 flex flex-col gap-6 shadow-xl">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2 drop-shadow-md">
                    <Settings className="w-5 h-5 text-blue-500 drop-shadow" />
                    Aparência do Projeto
                  </h2>
                  <p className="text-sm font-medium text-slate-200 drop-shadow">Personalize o plano de fundo do seu ambiente de trabalho.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: '', label: 'Padrão (Azul)' },
                    { id: '/backgrounds/bg4.jpg', label: 'Opção 2' },
                    { id: '/backgrounds/bg5.jpg', label: 'Opção 3' },
                    { id: '/backgrounds/bg6.jpg', label: 'Opção 4' },
                  ].map((bg, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedBg(bg.id)}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                        selectedBg === bg.id 
                          ? 'border-blue-500 ring-4 ring-blue-500/20' 
                          : 'border-transparent hover:border-slate-500'
                      }`}
                    >
                      {bg.id === '' ? (
                        <div className="w-full h-full bg-[#1e2336] flex items-center justify-center">
                          <span className="text-xs font-semibold text-slate-400">{bg.label}</span>
                        </div>
                      ) : (
                        <img src={bg.id} alt={`Background ${idx}`} className="w-full h-full object-cover" />
                      )}
                      
                      {selectedBg === bg.id && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 shadow-md">
                          <Shield className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-700/50 mt-2">
                  <button
                    onClick={handleSaveBackground}
                    disabled={selectedBg === (currentUser.background_url || '') || isSavingBg}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                  >
                    {isSavingBg ? 'Salvando...' : 'Aplicar'}
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-red-500/30 mt-12 shadow-xl">
                <h3 className="text-red-400 drop-shadow-md font-bold flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-5 h-5 drop-shadow" />
                  Zona de Perigo
                </h3>
                <p className="text-red-200/90 font-medium drop-shadow text-sm mb-6 max-w-2xl">
                  Ao excluir sua conta, você perderá acesso imediato ao sistema. Todas as suas tarefas pendentes ficarão órfãs e a operação não poderá ser desfeita.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? "Excluindo..." : "Excluir minha conta permanentemente"}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-blue-900/20 border border-blue-800/50 rounded-2xl p-5 flex items-start gap-4">
                <Shield className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-blue-400">Painel do Administrador</h3>
                  <p className="text-sm text-blue-300/80 mt-1">
                    Como administrador, você pode gerenciar a hierarquia, nível de acesso e o departamento de toda a equipe. 
                  </p>
                </div>
              </div>

              <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/40 backdrop-blur-md border-b border-white/10 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                      <th className="px-6 py-4">Colaborador</th>
                      <th className="px-6 py-4">Área</th>
                      <th className="px-6 py-4">Cargo (Nível)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {availableUsers.map(user => (
                      <tr key={user.id} className="hover:bg-[#2a3254] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=random`} alt="" className="w-9 h-9 border border-slate-600 rounded-full" />
                            <div>
                              <div className="text-sm font-bold text-slate-200">{user.full_name}</div>
                              <div className="text-xs text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.area || ''}
                            onChange={(e) => updateUserProfile(user.id, { area: e.target.value as Area })}
                            title="Selecionar departamento"
                            aria-label="Selecionar departamento"
                            className="text-sm border border-slate-700/50 rounded-xl py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none bg-[#1e2336] text-slate-300 shadow-sm cursor-pointer"
                          >
                            <option value="" disabled>Definir área...</option>
                            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value as Role)}
                            disabled={user.email === 'juliana.gomes081197@gmail.com' && currentUser.email !== 'juliana.gomes081197@gmail.com'}
                            title="Designar nível de acesso"
                            aria-label="Designar nível de acesso"
                            className="text-sm border border-slate-700/50 rounded-xl py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none bg-[#1e2336] text-slate-300 shadow-sm disabled:opacity-50 cursor-pointer"
                          >
                            {ROLES.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Recorte de Foto */}
        <AnimatePresence>
          {isCropping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-[#1e2336] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-700/50"
              >
                <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-500" />
                    Ajustar Foto
                  </h3>
                  <button 
                    onClick={() => { setIsCropping(false); setImgSrc(''); }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
                
                <div className="relative w-full h-80 bg-black/50">
                  <Cropper
                    image={imgSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                    onZoomChange={setZoom}
                  />
                </div>

                <div className="p-4 flex items-center gap-4 bg-black/40 backdrop-blur-md border-b border-white/10 shadow-sm">
                  <span className="text-sm font-semibold text-slate-400">Zoom</span>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="p-4 flex justify-end gap-3 bg-[#1e2336]">
                  <button
                    onClick={handleSaveCrop}
                    className="px-6 py-2.5 flex items-center gap-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                  >
                    Salvar Foto Original
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

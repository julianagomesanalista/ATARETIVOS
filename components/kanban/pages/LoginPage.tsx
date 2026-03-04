"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Star, User as UserIcon, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useKanban } from '@/context/KanbanContext';
import { COMPLEXITY_LABELS } from '@/utils/sla';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";
import { useRouter } from 'next/navigation';
import Avatar from '@/components/kanban/Avatar';
import WarningDashboard from '../WarningDashboard';
const ROLE_CONFIG = {
  admin: { label: 'Administrador', icon: Shield, color: 'from-red-500 to-rose-600', desc: 'Gerenciador e permissões globais.' },
  master: { label: 'Master', icon: Star, color: 'from-amber-500 to-orange-600', desc: 'Edita/exclui qualquer card ou comentário.' },
  user: { label: 'Usuário', icon: UserIcon, color: 'from-blue-500 to-indigo-600', desc: 'Cria, comenta e move cards.' },
};

export default function LoginPage() {
  const { loginWithGoogle, isAuthenticated, loginWithEmail } = useAuth();
  const router = useRouter();

  const { overdueTasks } = useKanban();
  const [step, setStep] = useState<'login' | 'overdue'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if(email) {
      loginWithEmail(email);
    }
  };

  React.useEffect(() => {
    if (isAuthenticated && step === 'login') {
      setStep('overdue');
    }
  }, [isAuthenticated, step]);



  return (
    <main suppressHydrationWarning className="relative h-screen w-screen bg-black flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 'login' ? (
          /* Login step */
          <motion.div
            suppressHydrationWarning
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex items-center justify-center p-0 m-0 overflow-hidden"
          >
            <Card suppressHydrationWarning className="w-full h-full bg-black border-none rounded-none relative overflow-hidden flex flex-col md:flex-row shadow-none m-0">
              <Spotlight
                className="-top-40 left-0 md:left-60 md:-top-20"
                fill="white"
              />
              
              <div suppressHydrationWarning className="flex h-full w-full flex-col md:flex-row">
                {/* Left content */}
                <div suppressHydrationWarning className="flex-1 p-8 md:p-14 md:pr-4 relative z-10 flex flex-col justify-center items-center text-center">
                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 tracking-tight mb-4">
                    ATARETIVOS
                  </h1>
                  <p className="text-neutral-300 text-lg md:text-xl max-w-lg font-medium mb-12">
                    Plataforma de gerenciamento de tarefas internas da <span className="text-blue-400 font-bold drop-shadow-sm">Ativos</span>
                  </p>

                  {/* Built-in Login Form */}
                  <div suppressHydrationWarning className="glass rounded-3xl p-6 shadow-2xl space-y-5 w-full max-w-sm backdrop-blur-md bg-black/40 border border-white/10 text-center">
                    <div suppressHydrationWarning className="space-y-1 text-center">
                      <h2 className="font-semibold text-lg text-white drop-shadow-md">Acesse sua conta</h2>
                    </div>

                    <form onSubmit={handleStandardLogin} className="space-y-4">
                      <input
                        type="email"
                        placeholder="E-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-12 bg-[#0f172a]/70 border border-slate-700/80 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                        required
                      />
                      <input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-12 bg-[#0f172a]/70 border border-slate-700/80 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                        required
                      />
                      <button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-linear-to-r from-blue-500 to-indigo-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/40 transition-all"
                      >
                        Entrar
                      </button>
                    </form>

                    <div suppressHydrationWarning className="relative">
                      <div suppressHydrationWarning className="absolute inset-0 flex items-center">
                        <div suppressHydrationWarning className="w-full border-t border-slate-600/50"></div>
                      </div>
                      <div suppressHydrationWarning className="relative flex justify-center text-xs">
                        <span className="bg-[#0b0b0b] px-3 py-0.5 rounded-full text-slate-300 font-medium z-10">Ou continue com</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={loginWithGoogle}
                      className="w-full h-12 rounded-xl bg-white text-slate-900 font-bold text-sm flex items-center justify-center gap-3 hover:bg-slate-100 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Continuar com o Google
                    </button>
                  </div>
                </div>

                {/* Right content - Spline Canvas */}
                <div suppressHydrationWarning className="flex-1 relative hidden md:block border-l border-white/5 bg-black/50 overflow-hidden">
                  <SplineScene 
                    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                    className="w-full h-full relative z-10"
                  />
                  {/* Fade gradient overlay for smooth transition */}
                  <div suppressHydrationWarning className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent pointer-events-none" />
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          /* Warning Dashboard Step */
          <WarningDashboard 
            overdueTasks={overdueTasks} 
            onDismiss={() => router.push('/dashboard')} 
          />
        )}
      </AnimatePresence>
    </main>
  );
}

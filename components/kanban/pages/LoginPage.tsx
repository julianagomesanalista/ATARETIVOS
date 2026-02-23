"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Star, User as UserIcon, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useKanban } from '@/context/KanbanContext';
import { COMPLEXITY_LABELS } from '@/utils/sla';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useGoogleLogin } from '@react-oauth/google';
import { Vortex } from '@/components/ui/vortex';
import { RevealText } from '@/components/ui/reveal-text';
import { useRouter } from 'next/navigation';

const ROLE_CONFIG = {
  admin: { label: 'Administrador', icon: Shield, color: 'from-red-500 to-rose-600', desc: 'Gerencia usuÃ¡rios e permissÃµes globais.' },
  master: { label: 'Master', icon: Star, color: 'from-amber-500 to-orange-600', desc: 'Edita/exclui qualquer card ou comentÃ¡rio.' },
  user: { label: 'UsuÃ¡rio', icon: UserIcon, color: 'from-blue-500 to-indigo-600', desc: 'Cria, comenta e move cards.' },
};

export default function LoginPage() {
  const { loginWithGoogle, isAuthenticated } = useAuth();
  const router = useRouter();

  const { overdueTasks } = useKanban();
  const [step, setStep] = useState<'login' | 'overdue'>('login');

  React.useEffect(() => {
    if (isAuthenticated && step === 'login') {
      if (overdueTasks.length > 0) {
        setStep('overdue');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, step, overdueTasks.length, router]);

  const handleGoogleSuccess = async (tokenResponse: any) => {
    try {
      const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      }).then(res => res.json());

      if (userInfo && userInfo.email) {
        loginWithGoogle(userInfo);
        if (overdueTasks.length > 0) {
          setStep('overdue');
        }
      }
    } catch (err) {
      console.error('Failed to fetch user info', err);
    }
  };

  const login = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => console.error('Login Failed')
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      {/* Vortex Background Layer â€” behind everything */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Vortex
          containerClassName="w-full h-full"
          backgroundColor="#000000"
          particleCount={200}
          rangeY={800}
          baseHue={220}
          rangeSpeed={1.5}
          baseRadius={1}
          rangeRadius={2}
        />
      </div>

      <AnimatePresence mode="wait">
        {step === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 w-full h-full"
          >
            {/* RevealText Layer */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <RevealText
                text="ATARETIVOS"
                textColor="text-white"
                fontSize="text-[12vw]"
                letterImages={[
                  { src: "/assets/team/1.png?v=2", backgroundSize: "contain", backgroundPosition: "center center" },
                  { src: "/assets/team/2.png?v=2", backgroundSize: "auto", backgroundPosition: "center center" },
                  { src: "/assets/team/3.png?v=2", backgroundSize: "contain", backgroundPosition: "center center" },
                  { src: "/assets/team/4.png?v=2", backgroundSize: "auto", backgroundPosition: "center center" },
                  { src: "/assets/team/5.png?v=2", backgroundSize: "auto", backgroundPosition: "center center" },
                  { src: "/assets/team/6.png?v=2", backgroundSize: "auto", backgroundPosition: "center center" },
                  { src: "/assets/team/7.png?v=2", backgroundSize: "auto", backgroundPosition: "center center" },
                  { src: "/assets/team/8.jpeg?v=2", backgroundSize: "contain", backgroundPosition: "center center" },
                  { src: "/assets/team/9.jpeg?v=2", backgroundSize: "auto", backgroundPosition: "center center" },
                  { src: "/assets/team/10.jpeg?v=2", backgroundSize: "contain", backgroundPosition: "center center" },
                ]}
              />
            </div>

            {/* Content Layer: Branding (Top) and Login (Bottom) strictly absolute positioned to avoid overlapping boxes */}
            
            {/* Top Section: Branding */}
            <div className="absolute top-12 left-0 right-0 z-50 flex flex-col items-center space-y-6 pointer-events-auto px-4">
              <p className="text-white text-lg md:text-xl font-medium tracking-wide text-center max-w-2xl drop-shadow-sm">
                Plataforma de gerenciamento de tarefas internas da{" "}
                <span className="text-blue-400 font-bold">Ativos</span>
              </p>
            </div>

            {/* Bottom Section: Login */}
            <div className="absolute bottom-12 left-0 right-0 z-50 flex flex-col items-center pointer-events-auto">
              <button 
                onClick={(e) => {
                  console.log("GOOGLE BUTTON CLICKED! Triggering useGoogleLogin...");
                  login();
                }}
                className="bg-white hover:bg-slate-50 text-slate-700 font-medium py-3 px-6 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.8)] transition-all flex items-center gap-3 transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <svg className="w-5 h-5 pointer-events-none" viewBox="0 0 24 24">
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
          </motion.div>
        ) : (
          /* Overdue Alert step */
          <motion.div
            key="overdue"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-8 w-full max-w-lg relative z-20 mx-auto mt-24"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Quadro de Avisos</h2>
                <p className="text-sm text-slate-400">{overdueTasks.length} tarefa{overdueTasks.length !== 1 ? 's' : ''} atrasada{overdueTasks.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6 max-h-72 overflow-y-auto scrollbar-thin">
              {overdueTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <span className="text-red-400 mt-0.5">âš ï¸</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{task.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {task.company_name} Â· {COMPLEXITY_LABELS[task.complexity]} Â· Venceu{' '}
                      {formatDistanceToNow(new Date(task.due_date), { locale: ptBR, addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Overdue Alert step */}
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              Entrar no Board
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, Comment, Role } from '@/types';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  availableUsers: User[];
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  canEditComment: (comment: Comment) => boolean;
  canDeleteTask: (creatorId: string) => boolean;
  canManageUsers: () => boolean;
  updateUserRole: (userId: string, newRole: Role) => Promise<void>;
  updateUserProfile: (userId: string, data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // Carregar todos os usuários do banco de dados (para popular o chat/atribuições)
  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (!error && data) {
      setAvailableUsers(data);
    }
  }, [supabase]);

  // Checar a sessão ativa ao carregar a página
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Busca do nosso BD 'users'
        const { data: userRecord } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();
        
        if (userRecord) {
          setCurrentUser(userRecord);
        } else {
          // Se não existir, criar (pode ocorrer no primeiro login com Google/Email)
          const newUser = {
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata.full_name || session.user.email?.split('@')[0],
            avatar_url: session.user.user_metadata.avatar_url || '',
            role: session.user.email === 'juliana.gomes081197@gmail.com' ? 'admin' : 'user',
            google_id: session.user.id
          };
          
          const { data: insertedUser, error } = await supabase
            .from('users')
            .insert(newUser)
            .select()
            .single();
            
          if (insertedUser) setCurrentUser(insertedUser);
        }
      }
      
      fetchUsers();
    };

    initAuth();

    // Listen to Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Mesma lógica de upsert de usuário ao fazer login
        const { data: userRecord } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();
          
        if (userRecord) {
          setCurrentUser(userRecord);
        } else {
          const newUser = {
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata.full_name || session.user.email?.split('@')[0],
            avatar_url: session.user.user_metadata.avatar_url || '',
            role: session.user.email === 'juliana.gomes081197@gmail.com' ? 'admin' : 'user',
            google_id: session.user.id
          };
          
          await supabase.from('users').insert(newUser);
          setCurrentUser(newUser as User);
        }
        fetchUsers();
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchUsers]);

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(`Erro no login: ${error.message}`);
    }
  };

  const loginWithEmail = async (email: string) => {
    try {
      // Opcional: Aqui seria necessário uma senha
      // Como a UI tem tela de senha, isso precisaria ser adaptado
      // Para simular "Magic Link"
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      toast.success('Link de login enviado para seu email!');
    } catch (error: any) {
      toast.error(`Erro no envio: ${error.message}`);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const canEditComment = useCallback(
    (comment: Comment): boolean => {
      if (!currentUser) return false;
      if (currentUser.role === 'admin' || currentUser.role === 'master') return true;
      return currentUser.id === comment.user_id;
    },
    [currentUser]
  );

  const canDeleteTask = useCallback(
    (creatorId: string): boolean => {
      if (!currentUser) return false;
      if (currentUser.role === 'admin' || currentUser.role === 'master') return true;
      return currentUser.id === creatorId;
    },
    [currentUser]
  );

  const canManageUsers = useCallback((): boolean => {
    return currentUser?.role === 'admin';
  }, [currentUser]);

  const updateUserRole = useCallback(async (userId: string, newRole: Role) => {
    if (!canManageUsers()) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
        
      if (error) throw error;
      
      setAvailableUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      if (currentUser?.id === userId) setCurrentUser((prev) => prev ? { ...prev, role: newRole } : null);
      toast.success('Cargo atualizado com sucesso!');
    } catch(err: any) {
      toast.error(`Erro ao atualizar cargo: ${err.message}`);
    }
  }, [currentUser, canManageUsers, supabase]);

  const updateUserProfile = useCallback(async (userId: string, data: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', userId);
        
      if (error) throw error;
      
      setAvailableUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...data } : u)));
      if (currentUser?.id === userId) setCurrentUser((prev) => prev ? { ...prev, ...data } : null);
      toast.success('Perfil atualizado com sucesso!');
    } catch(err: any) {
      toast.error(`Erro ao atualizar perfil: ${err.message}`);
    }
  }, [currentUser, supabase]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        availableUsers,
        loginWithGoogle,
        loginWithEmail,
        logout,
        canEditComment,
        canDeleteTask,
        canManageUsers,
        updateUserRole,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

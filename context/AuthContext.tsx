"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, Comment, Role } from '@/types';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { googleLogout } from '@react-oauth/google';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  availableUsers: User[];
  loginWithGoogle: (userInfo: any) => Promise<void>;
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
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
      // 1. Verificar se há um login do Google salvo localmente
      const storedGoogleUser = localStorage.getItem('kanban_google_user');
      if (storedGoogleUser) {
        try {
          const user = JSON.parse(storedGoogleUser);
          setCurrentUser(user);
          // Opcional: atualizar os dados dele com o banco em background
          const { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).single();
          if (dbUser) setCurrentUser(dbUser);
          fetchUsers();
          return; // Já logou, encerra o fluxo
        } catch (e) {
          localStorage.removeItem('kanban_google_user');
        }
      }

      // 2. Fluxo normal do Supabase (Email/Senha)
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

    // Real-time listener para os usuários (para o chat atualizar quando alguém se cadastrar/mudar de foto)
    const channel = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchUsers)
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchUsers]);

  const loginWithGoogle = async (userInfo: any) => {
    try {
      const email = userInfo.email;
      const name = userInfo.name || userInfo.given_name;
      const picture = userInfo.picture;
      const sub = userInfo.sub; // unique Google ID

      // Verifica se o usuário já existe no banco (pelo email)
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      let userToSet;

      if (existingUser) {
        // Preserve custom avatar (base64) - only use Google's picture if no custom one
        const hasCustomAvatar = existingUser.avatar_url && existingUser.avatar_url.startsWith('data:');
        const finalAvatar = hasCustomAvatar ? existingUser.avatar_url : picture;
        const updatedUser = { ...existingUser, avatar_url: finalAvatar, full_name: existingUser.full_name || name, google_id: sub };
        await supabase.from('users').update({ avatar_url: finalAvatar, full_name: updatedUser.full_name, google_id: sub }).eq('id', existingUser.id);
        userToSet = updatedUser;
      } else {
        // Novo usuário
        const isInitialAdmin = email === 'juliana.gomes081197@gmail.com';
        const newUser = {
          id: `usr-${sub}`, // unique string para n conflitar com uuids se houver
          google_id: sub,
          email: email,
          full_name: name,
          avatar_url: picture,
          role: isInitialAdmin ? 'admin' : 'user',
        };
        await supabase.from('users').insert(newUser);
        userToSet = newUser;
      }

      setCurrentUser(userToSet as User);
      localStorage.setItem('kanban_google_user', JSON.stringify(userToSet)); // Persistência
      toast.success('Login com Google efetuado!');
    } catch (error: any) {
      console.error('Failed to parse Google JWT or db error', error);
      toast.error(`Erro no login com Google: ${error.message || 'Desconhecido'}`);
    }
  };

  const loginWithEmail = async (email: string, password?: string) => {
    try {
      if (!password) {
        toast.error('A senha é obrigatória.');
        return;
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success('Login efetuado com sucesso!');
    } catch (error: any) {
      toast.error(`Erro no login: ${error.message}`);
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });
      if (error) throw error;
      
      if (data.user?.identities?.length === 0) {
        toast.error('Este email já está cadastrado. Tente fazer login.');
        return;
      }
      
      // Se não retornar sessão de imediato, significa que a confirmação de email está ativada no Supabase
      if (data.user && !data.session) {
        toast.success('Conta criada! Por favor, acesse seu e-mail e clique no link para confirmar seu cadastro.', { duration: 8000 });
      } else {
        toast.success('Conta criada com sucesso! Faça login para continuar.');
      }
    } catch (error: any) {
      toast.error(`Erro ao criar conta: ${error.message}`);
    }
  };

  const logout = async () => {
    try {
      googleLogout();
    } catch (error) {
       console.error(error);
    }
    localStorage.removeItem('kanban_google_user');
    setCurrentUser(null); // Force UI update immediately
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error(error);
    }
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
        signUpWithEmail,
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

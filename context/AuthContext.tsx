"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, Comment, Role } from '@/types';
import { mockUsers } from '@/data/mockData';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  availableUsers: User[];
  loginWithGoogle: (userInfo: any) => void;
  logout: () => void;
  canEditComment: (comment: Comment) => boolean;
  canDeleteTask: (creatorId: string) => boolean;
  canManageUsers: () => boolean;
  updateUserRole: (userId: string, newRole: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>(mockUsers);

  const loginWithGoogle = useCallback((userInfo: any) => {
    try {
      const email = userInfo.email;
      const name = userInfo.name || userInfo.given_name;
      const picture = userInfo.picture;
      const sub = userInfo.sub;

      setAvailableUsers((prevUsers) => {
        let existingUser = prevUsers.find((u) => u.email === email);
        
        if (existingUser) {
          existingUser = { ...existingUser, avatar_url: picture, full_name: name, google_id: sub };
          setCurrentUser(existingUser);
          return prevUsers.map(u => u.id === existingUser!.id ? existingUser! : u);
        } else {
          // Definir o seu email aqui para que você seja criado como Admin
          const ADMIN_EMAILS = ['juliana.gomes@example.com']; // Apenas como placeholder, você pode me informar seu e-mail real!
          const isInitialAdmin = ADMIN_EMAILS.includes(email);

          // New user
          const newUser: User = {
            id: `usr-${sub}`, // unique enough
            google_id: sub,
            email: email,
            full_name: name,
            avatar_url: picture,
            role: isInitialAdmin ? 'admin' : 'user',
            created_at: new Date().toISOString()
          };
          setCurrentUser(newUser);
          return [...prevUsers, newUser];
        }
      });
    } catch(err) {
      console.error('Failed to parse Google JWT', err);
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  /**
   * RBAC: can the current user edit a given comment?
   * Rules:
   *   - admin / master → always yes
   *   - user → only if they are the comment author
   */
  const canEditComment = useCallback(
    (comment: Comment): boolean => {
      if (!currentUser) return false;
      if (currentUser.role === 'admin' || currentUser.role === 'master') return true;
      return currentUser.id === comment.user_id;
    },
    [currentUser]
  );

  /**
   * Can the user delete a task?
   * admin / master can delete any; user can only delete their own
   */
  const canDeleteTask = useCallback(
    (creatorId: string): boolean => {
      if (!currentUser) return false;
      if (currentUser.role === 'admin' || currentUser.role === 'master') return true;
      return currentUser.id === creatorId;
    },
    [currentUser]
  );

  /** Only admin can manage user roles */
  const canManageUsers = useCallback((): boolean => {
    return currentUser?.role === 'admin';
  }, [currentUser]);

  const updateUserRole = useCallback(async (userId: string, newRole: Role) => {
    // Simulate API call
    console.log(`Alterando usuário ${userId} para ${newRole}`);
    await new Promise((resolve) => setTimeout(resolve, 500));

    setAvailableUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );

    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, role: newRole } : null));
    }
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        availableUsers,
        loginWithGoogle,
        logout,
        canEditComment,
        canDeleteTask,
        canManageUsers,
        updateUserRole,
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

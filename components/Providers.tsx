"use client";

import React, { ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/context/AuthContext';
import { KanbanProvider } from '@/context/KanbanContext';

// Client-side wrapper to inject all contexts
export function Providers({ children }: { children: ReactNode }) {
  // Use the same client ID as the kanban project
  const googleClientId = "890387212653-4i7n0daq04ffb7e0rp26dr58rjtnantl.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <KanbanProvider>
          {children}
        </KanbanProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

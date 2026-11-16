import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Usuario } from '../types';

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  login: (token: string, usuario: Usuario) => void;
  logout: () => void;
  actualizarToken: (token: string) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const stored = localStorage.getItem('usuario');
    return stored ? JSON.parse(stored) : null;
  });

  // Mantiene sincronizadas las pestañas abiertas (renovación, cierre de sesión)
  useEffect(() => {
    const alCambiar = (e: StorageEvent) => {
      if (e.key === 'token') setToken(e.newValue);
      if (e.key === 'usuario') setUsuario(e.newValue ? JSON.parse(e.newValue) : null);
    };
    window.addEventListener('storage', alCambiar);
    return () => window.removeEventListener('storage', alCambiar);
  }, []);

  const login = (nuevoToken: string, nuevoUsuario: Usuario) => {
    localStorage.setItem('token', nuevoToken);
    localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));
    setToken(nuevoToken);
    setUsuario(nuevoUsuario);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  };

  const actualizarToken = (nuevoToken: string) => {
    localStorage.setItem('token', nuevoToken);
    setToken(nuevoToken);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, actualizarToken, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
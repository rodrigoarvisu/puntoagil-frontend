import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  rolesPermitidos?: ('ADMIN' | 'CAJERO')[];
}

export default function ProtectedRoute({ children, rolesPermitidos }: ProtectedRouteProps) {
  const { isAuthenticated, usuario } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (rolesPermitidos && usuario && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/ventas/nueva" replace />;
  }

  return <>{children}</>;
}
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './routes/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';   
import Categorias from './pages/Categorias';
import Proveedores from './pages/Proveedores';
import NuevaCompra from './pages/NuevaCompra';
import Compras from './pages/Compras';
import NuevaVenta from './pages/NuevaVenta';
import Ventas from './pages/Ventas';
import CorteCajaPage from './pages/CorteCaja';
import Reportes from './pages/Reportes';
import { useAuth } from './context/AuthContext';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/productos"
          element={
            <ProtectedRoute>
              <Productos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categorias"
          element={
            <ProtectedRoute>
              <Categorias />
            </ProtectedRoute>
          }
        />
        <Route
          path="/proveedores"
          element={
            <ProtectedRoute>
              <Proveedores />
            </ProtectedRoute>
          }
        />
        <Route
          path="/compras/nueva"
          element={
            <ProtectedRoute>
              <NuevaCompra />
            </ProtectedRoute>
          }
        />
        <Route
          path="/compras"
          element={
            <ProtectedRoute>
              <Compras />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ventas/nueva"
          element={
            <ProtectedRoute>
              <NuevaVenta />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ventas"
          element={
            <ProtectedRoute>
              <Ventas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/corte-caja"
          element={
            <ProtectedRoute>
              <CorteCajaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reportes"
          element={
            <ProtectedRoute>
              <Reportes />
            </ProtectedRoute>
          }
        />
        {/* <-- 2. agrega este bloque, mismo patrón que /dashboard */}
        <Route path="/" element={<RedirectInicio />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


function RedirectInicio() {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  return <Navigate to={usuario.rol === 'ADMIN' ? '/dashboard' : '/ventas/nueva'} replace />;
}


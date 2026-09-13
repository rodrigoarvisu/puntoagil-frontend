import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { Usuario } from '../types';
import logo from '../assets/logo.puntoagil.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const loginResponse = await api.post('/auth/login', { email, password });
      const { token, id, nombre, rol } = loginResponse.data;
      const usuario: Usuario = { id, nombre, email, rol};
      login(token, usuario);
      navigate('/dashboard');
    } catch (err) {
      setError('Email o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Panel de marca */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0F1E3D] overflow-hidden flex-col justify-between p-12">
        {/* Marca de agua / Patrón sutil de fondo */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none flex items-center justify-center -rotate-12 scale-125">
          <div className="flex gap-2">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-full"
                style={{
                  width: [2, 4, 2, 6, 2, 3, 5][i % 7] * 2,
                  height: '120vh',
                }}
              />
            ))}
          </div>
        </div>

        
        <div className="relative z-10">
          <img src={logo} alt="PuntoÁgil" className="h-30 w-auto brightness-0 invert" />
        </div>

        
        <div className="relative z-10 max-w-lg">
          <h2 className="text-white text-4xl font-bold leading-tight tracking-tight">
            Cada venta, cada compra, cada peso, bajo control.
          </h2>
          <p className="text-blue-200/80 mt-4 text-base leading-relaxed">
            Punto de venta pensado para tiendas, refaccionarias y farmacias que necesitan
            claridad en su inventario y sus utilidades.
          </p>
        </div>

        
        <p className="text-blue-300/40 text-xs relative z-10">
          © {new Date().getFullYear()} PuntoÁgil POS. Todos los derechos reservados.
        </p>
      </div>

      
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-100">
          <img src={logo} alt="PuntoÁgil" className="h-20 mx-auto mb-8 lg:hidden" />

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Bienvenido de vuelta
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Inicia sesión para continuar en tu punto de venta.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tucorreo@tienda.com"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition text-sm"
                autoFocus 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-xl pl-4 pr-11 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  aria-label="Toggle password visibility"
                >
                  {mostrarPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12c1.274 4.057 5.065 7 9.542 7 4.477 0 8.268-2.943 9.542-7-1.274-4.057-5.065-7-9.542-7-4.477 0-8.268 2.943-9.542 7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#1D4ED8] text-white py-3 rounded-xl font-medium hover:bg-[#1a44c0] active:scale-[0.99] disabled:opacity-50 transition shadow-sm shadow-[#1D4ED8]/20 mt-2"
            >
              {cargando ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { Usuario } from '../types';
import logo from '../assets/logo.puntoagil.png';
import pos from '../assets/0000.webp';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [recordarme, setRecordarme] = useState(false);
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
      const usuario: Usuario = { id, nombre, email, rol };
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
      {/* Panel de marca (sin cambios respecto a la versión anterior) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0F1E3D] overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-20 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] animate-aurora-1" />
          <div className="absolute top-1/3 -right-32 w-[450px] h-[450px] bg-sky-500/25 rounded-full blur-[130px] animate-aurora-2" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[110px] animate-aurora-3" />
        </div>

        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white/40 animate-particle"
              style={{
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 100}%`,
                animationDelay: `${i * 0.6}s`,
                animationDuration: `${6 + (i % 5)}s`,
              }}
            />
          ))}
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

        <div className="relative z-10 flex justify-center items-end -mb-12 mt-8" style={{ perspective: '1000px' }}>
          <div className="absolute bottom-10 w-[420px] h-[420px] bg-blue-500/30 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
          <div className="absolute bottom-16 w-[240px] h-[180px] bg-sky-400/25 rounded-full blur-[70px] pointer-events-none" />
          <div className="relative w-[90%] max-w-md animate-float">
            <img
              src={pos}
              alt="PuntoÁgil"
              className="w-full drop-shadow-[0_35px_45px_rgba(0,0,0,0.55)]"
              style={{
                maskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)',
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none animate-shine"
              style={{
                background:
                  'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.05) 55%, transparent 70%)',
                maskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)',
              }}
            />
          </div>
        </div>

        <p className="text-blue-300/40 text-xs relative z-10">
          © {new Date().getFullYear()} PuntoÁgil POS. Todos los derechos reservados.
        </p>
      </div>

      {/* Panel de formulario — rediseñado */}
      <div className="flex-1 relative flex items-center justify-center p-6 sm:p-12 overflow-hidden">
        {/* Acentos de fondo suaves, para que no se vea plano */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-indigo-50 rounded-full blur-[90px] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.4] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 75%)',
          }}
        />

        <div className="relative w-full max-w-md bg-white/90 backdrop-blur-sm p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100">
          <img src={logo} alt="PuntoÁgil" className="h-20 mx-auto mb-8 lg:hidden" />

          {/* Icono insignia arriba del título */}
          <div className="w-12 h-12 rounded-xl bg-blue-80 flex items-center justify-center mb-5">
            <svg className="w-6 h-6 text-[#1D4ED8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>

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
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <svg className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tucorreo@gmail.com"
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition text-sm"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Contraseña</label>
              </div>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-11 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition text-sm"
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
              className="w-full bg-[#1D4ED8] text-white py-3 rounded-xl font-medium hover:bg-[#1a44c0] active:scale-[0.99] disabled:opacity-50 transition shadow-lg shadow-[#1D4ED8]/25 mt-2 flex items-center justify-center gap-2"
            >
              {cargando ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Ingresando...
                </>
              ) : (
                <>
                  Iniciar sesión
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
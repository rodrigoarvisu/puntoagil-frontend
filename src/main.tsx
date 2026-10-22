import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css';
import { NegocioProvider } from './context/NegocioContext.tsx';
import { iniciarAspecto } from './utils/aspecto.ts';

iniciarAspecto();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <NegocioProvider>
    <App />
    </NegocioProvider>
    </AuthProvider>
  </StrictMode>,
)

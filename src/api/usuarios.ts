import api from './axios';

export interface UsuarioData {
    id: number;
    nombre: string;
    email: string;
    rol: 'ADMIN' | 'CAJERO';
    activo: boolean;
}

export interface UsuarioCreateRequest {
    nombre: string;
    email: string;
    password: string;
    rol: 'ADMIN' | 'CAJERO';
}

export interface UsuarioUpdateRequest {
    nombre: string;
    email: string;
    rol: 'ADMIN' | 'CAJERO';
}

export const usuariosApi = {
    listarTodos: () => api.get<UsuarioData[]>('/usuarios'),
    crear: (usuario: UsuarioCreateRequest) => api.post<UsuarioData>('/usuarios', usuario),
    actualizar: (id: number, usuario: UsuarioUpdateRequest) => api.put<UsuarioData>(`/usuarios/${id}`, usuario),
    cambiarEstado: (id: number, activo: boolean) =>
        api.patch<UsuarioData>(`/usuarios/${id}/estado?activo=${activo}`),
}
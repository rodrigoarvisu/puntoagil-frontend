import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import MainLayout from '../components/layout/MainLayout';
import { corteCajaApi } from '../api/corteCaja';
import { aperturaCajaApi, type AperturaCajaData } from '../api/aperturaCaja';
import { ventasApi } from '../api/ventas';
import { useAuth } from '../context/AuthContext';
import type { CorteCaja } from '../types';

const notyf = new Notyf();

function ahora() {
  return new Date().toISOString();
}

export default function CorteCajaPage() {
  const { usuario } = useAuth();
  const [cortes, setCortes] = useState<CorteCaja[]>([]);
  const [cargando, setCargando] = useState(true);
  const [apertura, setApertura] = useState<AperturaCajaData | null>(null);
  const [cargandoApertura, setCargandoApertura] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [efectivoContado, setEfectivoContado] = useState(0);
  const [generando, setGenerando] = useState(false);
  const [corteSeleccionado, setCorteSeleccionado] = useState<CorteCaja | null>(null);
  const [efectivoEsperado, setEfectivoEsperado] = useState(0);

  const cargarDatos = async () => {
    setCargando(true);
    const res = await corteCajaApi.listarTodos();
    setCortes(res.data);
    setCargando(false);
  };

  const verificarAperturaActiva = async () => {
  setCargandoApertura(true);
  try {
    const res = await aperturaCajaApi.obtenerActiva();
    const activa = res.status === 200 && res.data ? res.data : null;
    setApertura(activa);
    if (activa) await calcularEfectivoEsperado(activa);
  } catch {
    setApertura(null);
  } finally {
    setCargandoApertura(false);
  }
};

  const calcularEfectivoEsperado = async (aperturaActiva: AperturaCajaData) => {
  const res = await ventasApi.listarTodas();
  const ventasEfectivoDesdeApertura = res.data.filter(
    (v) => v.metodoPago === 'EFECTIVO' && v.fecha && v.fecha >= aperturaActiva.fecha
  );
  const totalEfectivo = ventasEfectivoDesdeApertura.reduce((acc, v) => acc + (v.total ?? 0), 0);
  setEfectivoEsperado(aperturaActiva.montoInicial + totalEfectivo);
  };

  useEffect(() => {
    cargarDatos();
    verificarAperturaActiva();
  }, []);

  const abrirModal = () => {
    setEfectivoContado(0);
    setModalAbierto(true);
  };

  const handleGenerar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !apertura) return;

    const resultado = await Swal.fire({
      title: 'Cerrar caja',
      text: '¿Confirmas que ya contaste el efectivo? Esta acción cerrará la caja actual.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar caja',
      cancelButtonText: 'Cancelar',
    });
    if (!resultado.isConfirmed) return;

    setGenerando(true);
    try {
      const res = await corteCajaApi.generar({
        usuarioId: usuario.id,
        inicio: apertura.fecha,
        fin: ahora(),
        efectivoContado: Number(efectivoContado),
      });
      notyf.success({ message: 'Caja cerrada correctamente.', duration: 3000 });
      setModalAbierto(false);
      cargarDatos();
      verificarAperturaActiva();
      setCorteSeleccionado(res.data);
    } catch (err: any) {
      notyf.error({
        message: err?.response?.data?.mensaje || 'No se pudo generar el corte.',
        duration: 4000,
      });
    } finally {
      setGenerando(false);
    }
  };

  return (
    <MainLayout titulo="Corte de Caja">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Historial de cortes</h2>
        {!cargandoApertura && (
          apertura ? (
            <button
              onClick={abrirModal}
              className="bg-[#1D4ED8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a44c0] transition"
            >
              Cerrar caja
            </button>
          ) : (
            <span className="text-sm text-slate-400">No hay una caja abierta actualmente</span>
          )
        )}
      </div>

      {apertura && (
  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 text-sm text-blue-800 flex justify-between items-center">
    <span>
      Caja abierta desde <strong>{new Date(apertura.fecha).toLocaleString('es-MX')}</strong> ·
      Fondo inicial: <strong>${apertura.montoInicial.toFixed(2)}</strong>
    </span>
    <span className="font-semibold">
      Efectivo esperado: ${efectivoEsperado.toFixed(2)}
    </span>
  </div>
)}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0F1E3D] text-white text-left">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Total ventas</th>
              <th className="px-4 py-3">Utilidad</th>
              <th className="px-4 py-3">Efectivo contado</th>
              <th className="px-4 py-3">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Cargando...</td></tr>
            ) : cortes.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Sin cortes registrados</td></tr>
            ) : (
              cortes.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setCorteSeleccionado(c)}
                  className="border-t border-slate-100 cursor-pointer hover:bg-slate-50 transition"
                >
                  <td className="px-4 py-3 text-slate-600">
                    {c.fecha ? new Date(c.fecha).toLocaleString('es-MX') : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-medium">${c.totalVentas.toFixed(2)}</td>
                  <td className="px-4 py-3 text-green-600">${c.totalUtilidad.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600">${c.efectivoContado.toFixed(2)}</td>
                  <td className={`px-4 py-3 font-medium ${c.diferencia === 0 ? 'text-slate-600' : c.diferencia > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {c.diferencia > 0 ? '+' : ''}${c.diferencia.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && apertura && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-1">Cerrar caja</h3>
            <p className="text-sm text-slate-500 mb-4">
              Abierta desde {new Date(apertura.fecha).toLocaleString('es-MX')} · Fondo inicial: ${apertura.montoInicial.toFixed(2)}
            </p>
            <div className="bg-slate-50 rounded-lg px-3 py-2 mb-4 text-sm">
              <span className="text-slate-500">Efectivo esperado en caja: </span>
              <span className="font-semibold text-slate-800">${efectivoEsperado.toFixed(2)}</span>
            </div>
            <form onSubmit={handleGenerar} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Efectivo contado en caja
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  value={efectivoContado}
                  onChange={(e) => setEfectivoContado(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={generando}
                  className="px-4 py-2 text-sm bg-[#1D4ED8] text-white rounded-lg hover:bg-[#1a44c0] disabled:opacity-50"
                >
                  {generando ? 'Cerrando...' : 'Cerrar caja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {corteSeleccionado && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setCorteSeleccionado(null)}
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Corte #{corteSeleccionado.id}</h3>
              <button onClick={() => setCorteSeleccionado(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Total ventas</span>
                <span className="font-medium text-slate-800">${corteSeleccionado.totalVentas.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Utilidad</span>
                <span className="font-medium text-green-600">${corteSeleccionado.totalUtilidad.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Efectivo esperado</span>
                <span className="font-medium text-slate-800">${corteSeleccionado.efectivoEsperado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Efectivo contado</span>
                <span className="font-medium text-slate-800">${corteSeleccionado.efectivoContado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
                <span className="text-slate-500">Diferencia</span>
                <span className={`font-bold ${corteSeleccionado.diferencia === 0 ? 'text-slate-800' : corteSeleccionado.diferencia > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {corteSeleccionado.diferencia > 0 ? '+' : ''}${corteSeleccionado.diferencia.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
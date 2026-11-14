import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import { metodosPagoApi, type MetodoPago, type MetodoPagoForm, type TipoMetodoPago } from '../../api/metodosPago';
import { mensajeDeError } from '../../utils/errores';

const notyf = new Notyf();

const TIPOS: { valor: TipoMetodoPago; etiqueta: string }[] = [
  { valor: 'EFECTIVO', etiqueta: 'Efectivo' },
  { valor: 'TARJETA', etiqueta: 'Tarjeta' },
  { valor: 'TRANSFERENCIA', etiqueta: 'Transferencia' },
  { valor: 'OTRO', etiqueta: 'Otro' },
];
const etiquetaTipo = (t: TipoMetodoPago) => TIPOS.find((x) => x.valor === t)?.etiqueta ?? t;

const formVacio: MetodoPagoForm = { nombre: '', tipo: 'TARJETA', requiereReferencia: false };

const inputClass =
  'border border-slate-200 bg-[#E6EDFD] rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]';

export default function TabMetodosPago() {
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<MetodoPagoForm>(formVacio);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const res = await metodosPagoApi.listarTodos();
      setMetodos(res.data);
    } catch (err) {
      notyf.error({ message: mensajeDeError(err, 'No se pudieron cargar los métodos de pago.'), duration: 3500 });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirCrear = () => {
    setEditandoId(null);
    setForm(formVacio);
    setError('');
    setModalAbierto(true);
  };

  const abrirEditar = (m: MetodoPago) => {
    setEditandoId(m.id);
    setForm({ nombre: m.nombre, tipo: m.tipo, requiereReferencia: m.requiereReferencia });
    setError('');
    setModalAbierto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const datos = { ...form, nombre: form.nombre.trim() };
    if (!datos.nombre) {
      setError('El nombre es obligatorio.');
      return;
    }

    setGuardando(true);
    try {
      if (editandoId) {
        await metodosPagoApi.actualizar(editandoId, datos);
        notyf.success({ message: 'Método de pago actualizado.', duration: 3000 });
      } else {
        await metodosPagoApi.crear(datos);
        notyf.success({ message: 'Método de pago creado.', duration: 3000 });
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (err) {
      setError(mensajeDeError(err, 'Error al guardar el método de pago.'));
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarEstado = async (m: MetodoPago) => {
    const desactivar = m.activo;
    if (desactivar) {
      const r = await Swal.fire({
        title: '¿Desactivar método de pago?',
        text: `${m.nombre} ya no aparecerá al cobrar. Las ventas anteriores se conservan.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, desactivar',
        cancelButtonText: 'Cancelar',
      });
      if (!r.isConfirmed) return;
    }

    try {
      await metodosPagoApi.cambiarEstado(m.id, !m.activo);
      notyf.success({ message: `Método ${desactivar ? 'desactivado' : 'activado'}.`, duration: 3000 });
      cargarDatos();
    } catch (err) {
      notyf.error({ message: mensajeDeError(err, 'No se pudo cambiar el estado.'), duration: 4000 });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-slate-800">Métodos de pago</h2>
        <button
          onClick={abrirCrear}
          className="bg-[#1D4ED8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a44c0] transition mi-boton"
        >
          + Nuevo método
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Son las formas de cobro disponibles en caja. No se eliminan, solo se desactivan, para conservar el historial.
      </p>

      <div className="bg-white rounded-xl border border-[#0F1E3D] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0F1E3D] text-white text-left">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Referencia</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Cargando...</td></tr>
            ) : metodos.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Sin métodos de pago</td></tr>
            ) : (
              metodos.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{m.nombre}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                      {etiquetaTipo(m.tipo)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.requiereReferencia ? 'Obligatoria' : 'No requerida'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${m.activo ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                      {m.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => abrirEditar(m)} className="text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => handleCambiarEstado(m)} className="text-red-600 hover:underline">
                      {m.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editandoId ? 'Editar método de pago' : 'Nuevo método de pago'}
            </h3>

            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
                <input
                  required
                  maxLength={50}
                  autoFocus
                  value={form.nombre}
                  placeholder="Ej. Tarjeta de débito, Vales..."
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoMetodoPago })}
                  className={inputClass}
                >
                  {TIPOS.map((t) => (
                    <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Solo el tipo Efectivo suma al dinero esperado en el corte de caja.
                  {editandoId && ' Si el método ya tiene ventas, el tipo no se puede cambiar.'}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 pt-1">
                <input
                  type="checkbox"
                  checked={form.requiereReferencia}
                  onChange={(e) => setForm({ ...form, requiereReferencia: e.target.checked })}
                />
                Pedir folio o referencia al cobrar
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando}
                  className="px-4 py-2 text-sm bg-[#1D4ED8] text-white rounded-lg hover:bg-[#1a44c0] disabled:opacity-60">
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
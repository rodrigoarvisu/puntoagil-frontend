import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import MainLayout from '../components/layout/MainLayout';
import { comprasApi } from '../api/compras';
import { productosApi } from '../api/productos';
import { proveedoresApi } from '../api/proveedores';
import { useAuth } from '../context/AuthContext';
import type { Producto, Proveedor } from '../types';

interface LineaCarrito {
  productoId: number;
  nombre: string;
  cantidad: number;
  costoUnitario: number;
}

const notyf = new Notyf();

export default function NuevaCompra() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [proveedorId, setProveedorId] = useState<number | ''>('');
  const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [costoUnitario, setCostoUnitario] = useState(0);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    Promise.all([productosApi.listarTodos(), proveedoresApi.listarTodos()]).then(
      ([resProductos, resProveedores]) => {
        setProductos(resProductos.data);
        setProveedores(resProveedores.data);
      }
    );
  }, []);

  const seleccionarProducto = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setCostoUnitario(producto.costo);
    setBusquedaProducto(producto.nombre);
    setMostrarSugerencias(false);
  };

  const agregarAlCarrito = () => {
    if (!productoSeleccionado || cantidad <= 0 || costoUnitario < 0) return;

    setCarrito((prev) => {
      const existente = prev.find((l) => l.productoId === productoSeleccionado.id);

      if (existente) {
        return prev.map((l) =>
          l.productoId === productoSeleccionado.id
            ? { ...l, cantidad: l.cantidad + cantidad, costoUnitario }
            : l
        );
      }

      return [
        ...prev,
        {
          productoId: productoSeleccionado.id,
          nombre: productoSeleccionado.nombre,
          cantidad,
          costoUnitario
        }
      ];
    });

    setProductoSeleccionado(null);
    setBusquedaProducto('');
    setCantidad(1);
    setCostoUnitario(0);
  };

  const quitarLinea = (productoId: number) => {
    setCarrito((prev) => prev.filter((l) => l.productoId !== productoId));
  };

  const total = carrito.reduce(
    (acc, l) => acc + l.cantidad * l.costoUnitario,
    0
  );

  const sugerencias = busquedaProducto.trim()
    ? productos
        .filter((p) => {
          const q = busquedaProducto.toLowerCase();

          return (
            p.nombre.toLowerCase().includes(q) ||
            p.codigoBarras?.toLowerCase().includes(q)
          );
        })
        .slice(0, 8)
    : [];

  const handleRegistrarCompra = async () => {
    if (!proveedorId || carrito.length === 0 || !usuario) return;

    const resultado = await Swal.fire({
      title: 'Confirmar compra',
      text: `Se registrará una compra por $${total.toFixed(2)}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
    });

    if (!resultado.isConfirmed) return;

    setGuardando(true);

    try {
      await comprasApi.registrar({
        proveedor: { id: Number(proveedorId) },
        usuario: { id: usuario.id },
        detalles: carrito.map((l) => ({
          producto: { id: l.productoId },
          cantidad: l.cantidad,
          costoUnitario: l.costoUnitario,
        })),
      });

      notyf.success({
        message: 'Compra registrada correctamente.',
        duration: 3000
      });

      navigate('/compras');
    } catch {
      notyf.error({
        message: 'No se pudo registrar la compra.',
        duration: 4000
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <MainLayout titulo="Nueva Compra">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Proveedor
            </label>

            <select
              value={proveedorId}
              onChange={(e) => setProveedorId(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-4 bg-[#F1F5F9]"
            >
              <option value="">Selecciona proveedor</option>

              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-5 relative">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Producto
                </label>

                <input
                  type="text"
                  placeholder="Busca por nombre o escanea código de barras..."
                  value={busquedaProducto}
                  onChange={(e) => {
                    setBusquedaProducto(e.target.value);
                    setProductoSeleccionado(null);
                    setMostrarSugerencias(true);
                  }}
                  onFocus={() => setMostrarSugerencias(true)}
                  onBlur={() =>
                    setTimeout(() => setMostrarSugerencias(false), 150)
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-[#F1F5F9]"
                />

                {mostrarSugerencias && sugerencias.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {sugerencias.map((p) => (
                      <li
                        key={p.id}
                        onMouseDown={() => seleccionarProducto(p)}
                        className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer flex justify-between"
                      >
                        <span className="text-slate-800">
                          {p.nombre}
                        </span>

                        <span className="text-slate-400 text-xs">
                          {p.codigoBarras
                            ? `#${p.codigoBarras}`
                            : `Stock: ${p.stock}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Cantidad
                </label>

                <input
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-[#F1F5F9]"
                />
              </div>

              <div className="col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Costo unitario
                </label>

                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={costoUnitario}
                  onChange={(e) => setCostoUnitario(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-[#F1F5F9]"
                />
              </div>

              <div className="col-span-2">
                <button
                  onClick={agregarAlCarrito}
                  disabled={!productoSeleccionado}
                  className="w-full bg-[#1D4ED8] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#1a44c0] disabled:opacity-40 transition"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#0F1E3D] text-white text-left">
                <tr>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Costo unitario</th>
                  <th className="px-4 py-3">Subtotal</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>

              <tbody>
                {carrito.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-slate-400"
                    >
                      Aún no has agregado productos
                    </td>
                  </tr>
                ) : (
                  carrito.map((l) => (
                    <tr
                      key={l.productoId}
                      className="border-t border-slate-100"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {l.nombre}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {l.cantidad}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        ${l.costoUnitario.toFixed(2)}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        ${(l.cantidad * l.costoUnitario).toFixed(2)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => quitarLinea(l.productoId)}
                          className="text-red-600 hover:underline"
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 h-fit sticky top-20">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Resumen
          </h3>

          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Productos</span>
            <span>{carrito.length}</span>
          </div>

          <div className="flex justify-between text-lg font-bold text-slate-800 border-t border-slate-100 pt-3 mt-3">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button
            onClick={handleRegistrarCompra}
            disabled={!proveedorId || carrito.length === 0 || guardando}
            className="w-full mt-5 bg-[#1D4ED8] text-white py-3 rounded-xl font-medium hover:bg-[#1a44c0] disabled:opacity-40 transition"
          >
            {guardando ? 'Registrando...' : 'Registrar compra'}
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
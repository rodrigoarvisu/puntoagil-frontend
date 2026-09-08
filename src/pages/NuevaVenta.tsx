import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import MainLayout from '../components/layout/MainLayout';
import { ventasApi } from '../api/ventas';
import { productosApi } from '../api/productos';
import { useAuth } from '../context/AuthContext';
import type { Producto } from '../types';
import RequiereCajaAbierta from '../components/RequiereCajaAbierta';

interface LineaCarrito {
  productoId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  stockDisponible: number;
}

const notyf = new Notyf();

export default function NuevaVenta() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [dineroRecibido, setDineroRecibido] = useState(0);
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'>('EFECTIVO');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [precioUnitario, setPrecioUnitario] = useState(0);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    productosApi.listarTodos().then((res) => setProductos(res.data));
  }, []);

  const sugerencias = busquedaProducto.trim()
    ? productos
        .filter((p) => {
          const q = busquedaProducto.toLowerCase();
          return p.nombre.toLowerCase().includes(q) || p.codigoBarras?.toLowerCase().includes(q);
        })
        .slice(0, 8)
    : [];

  const seleccionarProducto = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setPrecioUnitario(producto.precioVenta);
    setBusquedaProducto(producto.nombre);
    setMostrarSugerencias(false);
    setCantidad(1);
  };

  const stockYaEnCarrito = (productoId: number) =>
    carrito.find((l) => l.productoId === productoId)?.cantidad ?? 0;

  const agregarAlCarrito = () => {
    if (!productoSeleccionado || cantidad <= 0 || precioUnitario < 0) return;

    const enCarrito = stockYaEnCarrito(productoSeleccionado.id);
    const disponibleReal = productoSeleccionado.stock - enCarrito;

    if (cantidad > disponibleReal) {
      notyf.error({
        message: `Stock insuficiente. Disponible: ${disponibleReal}`,
        duration: 3500,
      });
      return;
    }

    setCarrito((prev) => {
      const existente = prev.find((l) => l.productoId === productoSeleccionado.id);
      if (existente) {
        return prev.map((l) =>
          l.productoId === productoSeleccionado.id
            ? { ...l, cantidad: l.cantidad + cantidad, precioUnitario }
            : l
        );
      }
      return [
        ...prev,
        {
          productoId: productoSeleccionado.id,
          nombre: productoSeleccionado.nombre,
          cantidad,
          precioUnitario,
          stockDisponible: productoSeleccionado.stock,
        },
      ];
    });

    setProductoSeleccionado(null);
    setBusquedaProducto('');
    setCantidad(1);
    setPrecioUnitario(0);
  };

  const agregarPorCodigoBarras = (codigo: string) => {
  const producto = productos.find((p) => p.codigoBarras === codigo);
  if (!producto) {
    notyf.error({ message: `No se encontró ningún producto con ese código.`, duration: 3000 });
    return;
  }

  const enCarrito = stockYaEnCarrito(producto.id);
  const disponibleReal = producto.stock - enCarrito;

  if (disponibleReal < 1) {
    notyf.error({ message: `Sin stock disponible de "${producto.nombre}".`, duration: 3000 });
    return;
  }

  setCarrito((prev) => {
    const existente = prev.find((l) => l.productoId === producto.id);
    if (existente) {
      return prev.map((l) =>
        l.productoId === producto.id ? { ...l, cantidad: l.cantidad + 1 } : l
      );
    }
    return [
      ...prev,
      {
        productoId: producto.id,
        nombre: producto.nombre,
        cantidad: 1,
        precioUnitario: producto.precioVenta,
        stockDisponible: producto.stock,
      },
    ];
  });

  setBusquedaProducto('');
  setProductoSeleccionado(null);
  setMostrarSugerencias(false);
};

  const quitarLinea = (productoId: number) => {
    setCarrito((prev) => prev.filter((l) => l.productoId !== productoId));
  };

  const total = carrito.reduce((acc, l) => acc + l.cantidad * l.precioUnitario, 0);

  const cambio = metodoPago === 'EFECTIVO' ? dineroRecibido - total : 0;

  const handleRegistrarVenta = async () => {
    if (carrito.length === 0 || !usuario) return;

    if (metodoPago === 'EFECTIVO' && dineroRecibido < total) {
      notyf.error({
        message: 'El dinero recibido es menor al total.', duration: 3000
      });
      return;
    }

    setGuardando(true);
    try {
      await ventasApi.registrar({
        usuario: { id: usuario.id },
        metodoPago,
        detalles: carrito.map((l) => ({
          producto: { id: l.productoId },
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
        })),
      });
      notyf.success({ message: 'Venta registrada correctamente.', duration: 3000 });
      setDineroRecibido(0);
      navigate('/ventas');
    } catch (err: any) {
      const mensaje = err?.response?.data?.mensaje || 'No se pudo registrar la venta.';
      notyf.error({ message: mensaje, duration: 4500 });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <MainLayout titulo="Nueva Venta">
        <RequiereCajaAbierta>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-6 relative">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Producto</label>
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
                  onBlur={() => setTimeout(() => setMostrarSugerencias(false), 150)}
                  onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                  e.preventDefault();
                  if (productoSeleccionado) {
                   agregarAlCarrito();
                  } else if (busquedaProducto.trim()) {
                   agregarPorCodigoBarras(busquedaProducto.trim());
                  }
                 }
                }}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-[#F1F5F9]"
                  autoFocus
                />
                {mostrarSugerencias && sugerencias.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {sugerencias.map((p) => {
                      const disponible = p.stock - stockYaEnCarrito(p.id);
                      return (
                        <li
                          key={p.id}
                          onMouseDown={() => seleccionarProducto(p)}
                          className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer flex justify-between"
                        >
                          <span className="text-slate-800">{p.nombre}</span>
                          <span className={disponible <= 0 ? 'text-red-500 text-xs' : 'text-slate-400 text-xs'}>
                            Stock: {disponible}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-[#F1F5F9]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Precio</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={precioUnitario}
                  onChange={(e) => setPrecioUnitario(Number(e.target.value))}
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
                  <th className="px-4 py-3">Precio unitario</th>
                  <th className="px-4 py-3">Subtotal</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {carrito.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Aún no has agregado productos</td></tr>
                ) : (
                  carrito.map((l) => (
                    <tr key={l.productoId} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-800">{l.nombre}</td>
                      <td className="px-4 py-3 text-slate-600">{l.cantidad}</td>
                      <td className="px-4 py-3 text-slate-600">${l.precioUnitario.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-600">${(l.cantidad * l.precioUnitario).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => quitarLinea(l.productoId)} className="text-red-600 hover:underline">
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
  <h3 className="text-lg font-semibold text-slate-800 mb-4">Resumen de venta</h3>
  <div className="flex justify-between text-sm text-slate-600 mb-2">
    <span>Productos</span>
    <span>{carrito.length}</span>
  </div>
  <div className="flex justify-between text-lg font-bold text-slate-800 border-t border-slate-100 pt-3 mt-3">
    <span>Total</span>
    <span>${total.toFixed(2)}</span>
  </div>

  {/* AGREGA ESTO: */}
  <div className="mt-4">
  <label className="block text-sm font-medium text-slate-700 mb-2">Método de pago</label>
  <div className="grid grid-cols-3 gap-2">
    <button
      type="button"
      onClick={() => setMetodoPago('EFECTIVO')}
      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition ${
        metodoPago === 'EFECTIVO'
          ? 'border-[#1D4ED8] bg-blue-50 text-[#1D4ED8]'
          : 'border-slate-200 text-slate-500 hover:border-slate-300'
      }`}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={1.5} />
        <circle cx="12" cy="12" r="2.5" strokeWidth={1.5} />
      </svg>
      <span className="text-xs font-medium">Efectivo</span>
    </button>

    <button
      type="button"
      onClick={() => setMetodoPago('TARJETA')}
      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition ${
        metodoPago === 'TARJETA'
          ? 'border-[#1D4ED8] bg-blue-50 text-[#1D4ED8]'
          : 'border-slate-200 text-slate-500 hover:border-slate-300'
      }`}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth={1.5} />
        <line x1="2" y1="10" x2="22" y2="10" strokeWidth={1.5} />
      </svg>
      <span className="text-xs font-medium">Tarjeta</span>
    </button>

    <button
      type="button"
      onClick={() => setMetodoPago('TRANSFERENCIA')}
      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition ${
        metodoPago === 'TRANSFERENCIA'
          ? 'border-[#1D4ED8] bg-blue-50 text-[#1D4ED8]'
          : 'border-slate-200 text-slate-500 hover:border-slate-300'
      }`}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
      </svg>
      <span className="text-xs font-medium">Transferencia</span>
    </button>
  </div>
</div>

  {metodoPago === 'EFECTIVO' && (
  <div className="mt-3">
    <label className="block text-sm font-medium text-slate-700 mb-1.5">Dinero recibido</label>
    <input
      type="number"
      step="0.01"
      min={0}
      value={dineroRecibido}
      onChange={(e) => setDineroRecibido(Number(e.target.value))}
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
    />
    {dineroRecibido > 0 && (
      <p className={`text-sm mt-1.5 font-medium ${cambio >= 0 ? 'text-green-600' : 'text-red-500'}`}>
        {cambio >= 0 ? `Cambio: $${cambio.toFixed(2)}` : `Faltan $${Math.abs(cambio).toFixed(2)}`}
      </p>
    )}
  </div>
)}

  <button
    onClick={handleRegistrarVenta}
    disabled={carrito.length === 0 || guardando}
    className="w-full mt-5 bg-[#1D4ED8] text-white py-3 rounded-xl font-medium hover:bg-[#1a44c0] disabled:opacity-40 transition"
  >
    {guardando ? 'Registrando...' : 'Cobrar'}
  </button>
</div>
      </div>
      </RequiereCajaAbierta>
    </MainLayout>
  );
}
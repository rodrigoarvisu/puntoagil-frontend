import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import MainLayout from '../components/layout/MainLayout';
import { ventasApi } from '../api/ventas';
import { productosApi } from '../api/productos';
import { metodosPagoApi, type MetodoPago } from '../api/metodosPago';
import SelectorMetodoPago from '../components/ventas/SelectorMetodoPago';
import { generarClave } from '../utils/clave';
import { mensajeDeError } from '../utils/errores';
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

const inputClass =
  'border border-slate-200 bg-[#E6EDFD] rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]';

const aCentavos = (n: number) => Math.round(n * 100);

export default function NuevaVenta() {
  const navigate = useNavigate();

  const [dineroRecibido, setDineroRecibido] = useState(0);
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [metodoId, setMetodoId] = useState<number | null>(null);
  const [referencia, setReferencia] = useState('');
  const [cargandoMetodos, setCargandoMetodos] = useState(true);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [guardando, setGuardando] = useState(false);

  // Clave que evita registrar dos veces la misma venta (doble clic, reintento por red lenta)
  const claveRef = useRef(generarClave());
  // Si cambia el carrito o el pago, es otra venta: clave nueva
  useEffect(() => {
    claveRef.current = generarClave();
  }, [carrito, metodoId, referencia]);

  useEffect(() => {
    productosApi
      .listarTodos()
      .then((res) => setProductos(res.data))
      .catch((err) => notyf.error({ message: mensajeDeError(err, 'No se pudieron cargar los productos.'), duration: 3500 }));

    metodosPagoApi
      .listarActivos()
      .then((res) => {
        setMetodos(res.data);
        const inicial = res.data.find((m) => m.tipo === 'EFECTIVO') ?? res.data[0];
        setMetodoId(inicial ? inicial.id : null);
      })
      .catch((err) => notyf.error({ message: mensajeDeError(err, 'No se pudieron cargar los métodos de pago.'), duration: 3500 }))
      .finally(() => setCargandoMetodos(false));
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
    setBusquedaProducto(producto.nombre);
    setMostrarSugerencias(false);
    setCantidad(1);
  };

  const stockYaEnCarrito = (productoId: number) =>
    carrito.find((l) => l.productoId === productoId)?.cantidad ?? 0;

  const agregarAlCarrito = () => {
    if (!productoSeleccionado) return;
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      notyf.error({ message: 'La cantidad debe ser un número entero mayor a cero.', duration: 3000 });
      return;
    }

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
            ? { ...l, cantidad: l.cantidad + cantidad, precioUnitario: productoSeleccionado.precioVenta }
            : l
        );
      }
      return [
        ...prev,
        {
          productoId: productoSeleccionado.id,
          nombre: productoSeleccionado.nombre,
          cantidad,
          precioUnitario: productoSeleccionado.precioVenta,
          stockDisponible: productoSeleccionado.stock,
        },
      ];
    });

    setProductoSeleccionado(null);
    setBusquedaProducto('');
    setCantidad(1);
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

  // Todo en centavos para que el total coincida exacto con el del servidor
  const totalCentavos = carrito.reduce(
    (acc, l) => acc + aCentavos(l.precioUnitario) * l.cantidad,
    0
  );
  const total = totalCentavos / 100;

  const metodo = metodos.find((m) => m.id === metodoId) ?? null;
  const esEfectivo = metodo?.tipo === 'EFECTIVO';
  const cambio = esEfectivo ? (aCentavos(dineroRecibido) - totalCentavos) / 100 : 0;

  const puedeCobrar =
    carrito.length > 0 &&
    totalCentavos > 0 &&
    metodo !== null &&
    !guardando &&
    (!esEfectivo || cambio >= 0) &&
    (!metodo.requiereReferencia || referencia.trim().length > 0);

  const seleccionarMetodo = (m: MetodoPago) => {
    setMetodoId(m.id);
    setReferencia('');
    setDineroRecibido(0);
  };

  // Tras un rechazo del servidor, se alinean precios y stock con la BD
  const refrescarProductos = async () => {
    try {
      const res = await productosApi.listarTodos();
      setProductos(res.data);
      setCarrito((prev) =>
        prev.map((l) => {
          const p = res.data.find((x) => x.id === l.productoId);
          return p ? { ...l, precioUnitario: p.precioVenta, stockDisponible: p.stock } : l;
        })
      );
    } catch {
      /* se conserva lo que había */
    }
  };

  const handleRegistrarVenta = async () => {
    if (!puedeCobrar || !metodo) return;

    setGuardando(true);
    try {
      await ventasApi.registrar({
        detalles: carrito.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad })),
        pagos: [
          {
            metodoPagoId: metodo.id,
            monto: total, // el pago es el total; el cambio solo se muestra, no se registra
            referencia: referencia.trim() || undefined,
          },
        ],
        claveIdempotencia: claveRef.current,
      });
      const conCambio = esEfectivo && cambio > 0;
      notyf.success({
        message: conCambio ? `Venta registrada. Cambio: $${cambio.toFixed(2)}` : 'Venta registrada correctamente.',
        duration: conCambio ? 6000 : 3000,
      });
      setDineroRecibido(0);
      navigate('/ventas');
    } catch (err) {
      notyf.error({ message: mensajeDeError(err, 'No se pudo registrar la venta.'), duration: 4500 });
      refrescarProductos();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <MainLayout titulo="Nueva Venta">
      <RequiereCajaAbierta>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-[#0F1E3D] p-5">
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
                    className={inputClass}
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
                    step={1}
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Precio</label>
                  <input
                    type="number"
                    readOnly
                    tabIndex={-1}
                    title="El precio se toma del producto"
                    value={productoSeleccionado ? productoSeleccionado.precioVenta : 0}
                    className={`${inputClass} cursor-not-allowed opacity-70`}
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

            <div className="bg-white rounded-xl border border-[#0F1E3D] overflow-hidden">
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
                      <tr key={l.productoId} className="border-t border-slate-200">
                        <td className="px-4 py-3 font-medium text-slate-800">{l.nombre}</td>
                        <td className="px-4 py-3 text-slate-600">{l.cantidad}</td>
                        <td className="px-4 py-3 text-slate-600">${l.precioUnitario.toFixed(2)}</td>
                        <td className="px-4 py-3 text-slate-600">${((aCentavos(l.precioUnitario) * l.cantidad) / 100).toFixed(2)}</td>
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

          <div className="bg-white rounded-xl border border-[#0F1E3D] p-5 h-fit sticky top-20">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Resumen de venta</h3>
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Productos</span>
              <span>{carrito.length}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-slate-800 border-t border-[#0F1E3D] pt-3 mt-3">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Método de pago</label>
              {cargandoMetodos ? (
                <p className="text-sm text-slate-400">Cargando...</p>
              ) : metodos.length === 0 ? (
                <p className="text-sm text-red-500">
                  No hay métodos de pago activos. Avisa a un administrador.
                </p>
              ) : (
                <SelectorMetodoPago
                  metodos={metodos}
                  seleccionadoId={metodoId}
                  onChange={seleccionarMetodo}
                />
              )}
            </div>

            {metodo?.requiereReferencia && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Folio o referencia
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            {esEfectivo && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Dinero recibido</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={dineroRecibido}
                  onChange={(e) => setDineroRecibido(Number(e.target.value))}
                  className={inputClass}
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
              disabled={!puedeCobrar}
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
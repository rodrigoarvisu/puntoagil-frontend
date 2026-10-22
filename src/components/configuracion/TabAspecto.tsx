import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ASPECTO_POR_DEFECTO,
  aplicarAspecto,
  guardarAspecto,
  leerAspecto,
  type Aspecto,
  type Densidad,
  type TamanoTexto,
  type Tema,
} from '../../utils/aspecto';

type Opcion<T extends string> = { valor: T; etiqueta: string };

const TEMAS: Opcion<Tema>[] = [
  { valor: 'claro', etiqueta: 'Claro' },
  { valor: 'oscuro', etiqueta: 'Oscuro' },
  { valor: 'sistema', etiqueta: 'Automático' },
];

const TEXTO: Opcion<TamanoTexto>[] = [
  { valor: 'pequeno', etiqueta: 'Pequeño' },
  { valor: 'normal', etiqueta: 'Normal' },
  { valor: 'grande', etiqueta: 'Grande' },
];

const DENSIDAD: Opcion<Densidad>[] = [
  { valor: 'comoda', etiqueta: 'Cómoda' },
  { valor: 'compacta', etiqueta: 'Compacta' },
];

const MUESTRA = [
  { nombre: 'Conchas Tía Rosa', precio: 20, stock: 5 },
  { nombre: 'Sabritas', precio: 22, stock: 19 },
  { nombre: 'Corona 600ml', precio: 28, stock: 10 },
];

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-[#0F1E3D] p-6 mb-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">{titulo}</h3>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

// Selector de una opción entre varias (radios nativos ocultos: funciona con teclado)
function Opciones<T extends string>({
  leyenda,
  ayuda,
  valor,
  opciones,
  onChange,
}: {
  leyenda: string;
  ayuda: string;
  valor: T;
  opciones: Opcion<T>[];
  onChange: (valor: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-800">{leyenda}</legend>
      <p className="text-xs text-slate-400 mt-0.5">{ayuda}</p>
      <div className="mt-3 inline-flex rounded-lg border border-slate-200 bg-[#E6EDFD] p-1">
        {opciones.map((o) => (
          <label
            key={o.valor}
            className={`cursor-pointer select-none rounded-md px-4 py-1.5 text-sm font-medium transition focus-within:ring-2 focus-within:ring-[#1D4ED8]/40 ${
              o.valor === valor
                ? 'bg-[#1D4ED8] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <input
              type="radio"
              name={leyenda}
              checked={o.valor === valor}
              onChange={() => onChange(o.valor)}
              className="sr-only"
            />
            {o.etiqueta}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function TabAspecto() {
  const [aspecto, setAspecto] = useState<Aspecto>(leerAspecto);

  // Cada cambio se guarda en el equipo y se aplica a toda la app al instante
  useEffect(() => {
    guardarAspecto(aspecto);
    aplicarAspecto(aspecto);
  }, [aspecto]);

  const cambiar = <K extends keyof Aspecto>(campo: K, valor: Aspecto[K]) =>
    setAspecto((prev) => ({ ...prev, [campo]: valor }));

  const esPorDefecto = (Object.keys(ASPECTO_POR_DEFECTO) as (keyof Aspecto)[]).every(
    (campo) => aspecto[campo] === ASPECTO_POR_DEFECTO[campo]
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Aspecto</h2>
        <p className="text-sm text-slate-500 mt-1">
          Personaliza cómo se ve el sistema. Los cambios se aplican al instante.
        </p>
      </div>

      <Seccion titulo="Tema">
        <Opciones
          leyenda="Apariencia"
          ayuda="Automático sigue la configuración de tu sistema operativo."
          valor={aspecto.tema}
          opciones={TEMAS}
          onChange={(v) => cambiar('tema', v)}
        />
      </Seccion>

      <Seccion titulo="Texto">
        <Opciones
          leyenda="Tamaño del texto"
          ayuda="Se aplica a todo el sistema."
          valor={aspecto.tamanoTexto}
          opciones={TEXTO}
          onChange={(v) => cambiar('tamanoTexto', v)}
        />
      </Seccion>

      <Seccion titulo="Tablas">
        <Opciones
          leyenda="Densidad"
          ayuda="La compacta muestra más filas en pantalla."
          valor={aspecto.densidad}
          opciones={DENSIDAD}
          onChange={(v) => cambiar('densidad', v)}
        />
      </Seccion>

      <Seccion titulo="Movimiento">
        <div className="flex items-center justify-between gap-4">
          <div>
            <label htmlFor="reducir-animaciones" className="text-sm font-medium text-slate-800">
              Reducir animaciones
            </label>
            <p className="text-xs text-slate-400 mt-0.5">
              Desactiva transiciones y efectos de movimiento.
            </p>
          </div>
          <button
            id="reducir-animaciones"
            type="button"
            role="switch"
            aria-checked={aspecto.reducirAnimaciones}
            onClick={() => cambiar('reducirAnimaciones', !aspecto.reducirAnimaciones)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/40 ${
              aspecto.reducirAnimaciones ? 'bg-[#1D4ED8]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                aspecto.reducirAnimaciones ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </Seccion>

      <Seccion titulo="Vista previa">
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#0F1E3D] text-white text-left">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
              </tr>
            </thead>
            <tbody>
              {MUESTRA.map((p) => (
                <tr key={p.nombre} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">${p.precio.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600">{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Seccion>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">Estos ajustes se guardan solo en este equipo.</p>
        <button
          type="button"
          onClick={() => setAspecto(ASPECTO_POR_DEFECTO)}
          disabled={esPorDefecto}
          className="h-10 px-4 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Restablecer valores
        </button>
      </div>
    </div>
  );
}
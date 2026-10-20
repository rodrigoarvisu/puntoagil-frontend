import { useEffect } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import CampoFormulario from '../ui/CampoFormulario';
import { useDatosNegocio } from '../../hook/useDatosNegocio';
import type { CampoNegocio } from '../../types';

const botonPrimario =
  'h-10 bg-[#1D4ED8] text-white px-4 rounded-lg text-sm font-medium hover:bg-[#1a44c0] transition ' +
  'disabled:opacity-40 disabled:cursor-not-allowed';
const botonSecundario =
  'h-10 px-4 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition ' +
  'disabled:opacity-40 disabled:cursor-not-allowed';

/* ───────── Piezas de presentación ───────── */

function Seccion({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-[#0F1E3D] p-6 mb-6">
      <h3 className="text-sm font-semibold text-slate-800">{titulo}</h3>
      <p className="text-xs text-slate-400 mt-0.5 mb-4">{descripcion}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Esqueleto() {
  return (
    <div aria-hidden className="animate-pulse">
      {[3, 3, 5].map((campos, i) => (
        <div key={i} className="bg-white rounded-xl border border-[#0F1E3D] p-6 mb-6">
          <div className="h-4 w-40 bg-slate-200 rounded mb-5" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: campos }).map((_, j) => (
              <div key={j} className="h-10 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────── Pestaña ───────── */
interface TabDatosProps {
  onCambiosPendientes?: (hay: boolean) => void;
}

export default function TabDatos({ onCambiosPendientes }: TabDatosProps) {
  const {
    datos,
    errores,
    cargando,
    errorCarga,
    guardando,
    hayCambios,
    actualizarCampo,
    descartar,
    guardar,
    recargar,
  } = useDatosNegocio();

  // Avisa al navegador si se intenta cerrar o recargar con cambios sin guardar
  useEffect(() => {
    if (!hayCambios) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [hayCambios]);

  useEffect(() => {
    onCambiosPendientes?.(hayCambios);
    return () => onCambiosPendientes?.(false);
  }, [hayCambios, onCambiosPendientes]);

  // Props comunes de cada campo: nombre, valor, error y cambio
  const campo = (nombre: CampoNegocio) => ({
    name: nombre,
    value: datos[nombre],
    error: errores[nombre],
    disabled: guardando,
    onChange: (e: ChangeEvent<HTMLInputElement>) => actualizarCampo(nombre, e.target.value),
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formulario = e.currentTarget; // se guarda antes del await
    const resultado = await guardar();
    if (!resultado.ok && resultado.campoConError) {
      (formulario.elements.namedItem(resultado.campoConError) as HTMLElement | null)?.focus();
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Datos del negocio</h2>
        <p className="text-sm text-slate-500 mt-1">Información que identifica a tu negocio.</p>
      </div>

      {cargando ? (
        <Esqueleto />
      ) : errorCarga ? (
        <div
          role="alert"
          className="bg-red-50 text-red-600 text-sm px-4 py-4 rounded-xl flex items-center justify-between gap-4"
        >
          <span>No se pudieron cargar los datos del negocio.</span>
          <button
            type="button"
            onClick={recargar}
            className="h-9 px-3 rounded-lg bg-white border border-red-200 text-red-600 font-medium hover:bg-red-100 transition"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate aria-busy={guardando}>
          <Seccion titulo="Información general" descripcion="Nombre comercial y datos fiscales.">
            <CampoFormulario
              etiqueta="Nombre del negocio"
              obligatorio
              maxLength={100}
              placeholder="Ej. Abarrotes La Esquina"
              autoComplete="organization"
              className="md:col-span-2"
              {...campo('nombre')}
            />
            <CampoFormulario
              etiqueta="Razón social"
              maxLength={150}
              placeholder="Ej. Juan Pérez López"
              {...campo('razonSocial')}
            />
            <CampoFormulario
              etiqueta="RFC"
              maxLength={13}
              placeholder="XAXX010101000"
              autoCapitalize="characters"
              ayuda="12 caracteres para persona moral, 13 para persona física."
              {...campo('rfc')}
              onChange={(e) => actualizarCampo('rfc', e.target.value.toUpperCase())}
            />
          </Seccion>

          <Seccion titulo="Contacto" descripcion="Cómo pueden comunicarse con tu negocio.">
            <CampoFormulario
              etiqueta="Teléfono"
              type="tel"
              inputMode="tel"
              maxLength={15}
              placeholder="55 1234 5678"
              autoComplete="tel"
              {...campo('telefono')}
            />
            <CampoFormulario
              etiqueta="Correo electrónico"
              type="email"
              maxLength={120}
              placeholder="contacto@minegocio.com"
              autoComplete="email"
              {...campo('email')}
            />
            <CampoFormulario
              etiqueta="Sitio web"
              inputMode="url"
              maxLength={150}
              placeholder="www.minegocio.com"
              className="md:col-span-2"
              {...campo('sitioWeb')}
            />
          </Seccion>

          <Seccion titulo="Dirección" descripcion="Ubicación del establecimiento.">
            <CampoFormulario
              etiqueta="Calle y número"
              maxLength={150}
              placeholder="Av. Principal 123"
              autoComplete="address-line1"
              className="md:col-span-2"
              {...campo('calle')}
            />
            <CampoFormulario
              etiqueta="Colonia"
              maxLength={100}
              autoComplete="address-line2"
              {...campo('colonia')}
            />
            <CampoFormulario
              etiqueta="Código postal"
              inputMode="numeric"
              maxLength={5}
              placeholder="00000"
              autoComplete="postal-code"
              {...campo('codigoPostal')}
              onChange={(e) => actualizarCampo('codigoPostal', e.target.value.replace(/\D/g, ''))}
            />
            <CampoFormulario
              etiqueta="Ciudad"
              maxLength={100}
              autoComplete="address-level2"
              {...campo('ciudad')}
            />
            <CampoFormulario
              etiqueta="Estado"
              maxLength={100}
              autoComplete="address-level1"
              {...campo('estado')}
            />
          </Seccion>

          <div className="flex items-center justify-end gap-3">
            {hayCambios && !guardando && (
              <span className="text-xs text-amber-600 mr-auto">Tienes cambios sin guardar</span>
            )}
            <button
              type="button"
              onClick={descartar}
              disabled={!hayCambios || guardando}
              className={botonSecundario}
            >
              Descartar cambios
            </button>
            <button type="submit" disabled={!hayCambios || guardando} className={botonPrimario}>
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
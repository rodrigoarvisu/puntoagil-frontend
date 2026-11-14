export function generarClave(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
}
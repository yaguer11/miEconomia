/**
 * Genera un código de invitación único para una familia.
 * Formato: PREFIJO-XXXX (ej: GARCIA-4X7K)
 */
export function generarCodigo(nombreFamilia = '') {
  const prefix = nombreFamilia
    .replace(/[^A-Z0-9]/gi, '')
    .slice(0, 6)
    .toUpperCase() || 'FAM'
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${suffix}`
}

/**
 * Copia texto al portapapeles y retorna true si fue exitoso.
 */
export async function copiarAlPortapapeles(texto) {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    return false
  }
}

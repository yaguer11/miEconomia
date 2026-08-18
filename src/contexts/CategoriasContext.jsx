/**
 * CategoriasContext — singleton para categorías y subcategorías.
 *
 * Al envolver la app con <CategoriasProvider> el hook useCategorias()
 * se instancia UNA SOLA VEZ, evitando seeds duplicados cuando múltiples
 * componentes consumen la misma data.
 */
import { createContext, useContext } from 'react'
import { useCategorias as useCatHook } from '../hooks/useCategorias'

const CategoriasContext = createContext(null)

export function CategoriasProvider({ children }) {
  const value = useCatHook()
  return (
    <CategoriasContext.Provider value={value}>
      {children}
    </CategoriasContext.Provider>
  )
}

export function useCategorias() {
  const ctx = useContext(CategoriasContext)
  if (!ctx) throw new Error('useCategorias debe usarse dentro de <CategoriasProvider>')
  return ctx
}

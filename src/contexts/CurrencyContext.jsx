import { createContext, useContext, useState } from 'react'
import { useDolar } from '../hooks/useDolar'

const CurrencyContext = createContext(null)

/**
 * Modos de visualización disponibles:
 * - 'ARS': Muestra solo montos en ARS (los USD se muestran separados o ignorados según el contexto)
 * - 'USD': Muestra solo montos en USD (los ARS se convierten o ignoran)
 * - 'unified_ARS': Todo unificado en ARS (USD × tasa MEP)
 * - 'unified_USD': Todo unificado en USD (ARS ÷ tasa MEP)
 */
export const VIEW_MODES = [
  { id: 'ARS',         label: 'Solo ARS',        symbol: '$',  emoji: '🇦🇷' },
  { id: 'USD',         label: 'Solo USD',         symbol: 'U$D', emoji: '🇺🇸' },
  { id: 'unified_ARS', label: 'Unificado en ARS', symbol: '$',  emoji: '🔀' },
  { id: 'unified_USD', label: 'Unificado en USD', symbol: 'U$D', emoji: '🔀' },
]

export function CurrencyProvider({ children }) {
  const [viewMode, setViewMode] = useState('unified_ARS')
  const dolar = useDolar('bolsa') // MEP por defecto

  const { tasaVentaMEP } = dolar

  /**
   * Convierte un monto a ARS según su moneda original.
   * Si la tasa no está disponible y la moneda es USD, retorna null.
   */
  const convertToARS = (monto, moneda) => {
    if (moneda === 'ARS') return Number(monto)
    if (moneda === 'USD') {
      if (!tasaVentaMEP) return null
      return Number(monto) * tasaVentaMEP
    }
    return Number(monto)
  }

  /**
   * Convierte un monto a USD según su moneda original.
   * Si la tasa no está disponible y la moneda es ARS, retorna null.
   */
  const convertToUSD = (monto, moneda) => {
    if (moneda === 'USD') return Number(monto)
    if (moneda === 'ARS') {
      if (!tasaVentaMEP) return null
      return Number(monto) / tasaVentaMEP
    }
    return Number(monto)
  }

  /**
   * Calcula el valor de un monto según el viewMode activo.
   * Retorna null si la conversión no es posible (sin tasa).
   */
  const getValueInMode = (monto, moneda, mode = viewMode) => {
    const n = Number(monto)
    switch (mode) {
      case 'ARS':         return moneda === 'ARS' ? n : null
      case 'USD':         return moneda === 'USD' ? n : null
      case 'unified_ARS': return convertToARS(n, moneda)
      case 'unified_USD': return convertToUSD(n, moneda)
      default:            return n
    }
  }

  /**
   * Suma una lista de items [{monto, moneda}] según el viewMode activo.
   * Los items no convertibles (sin tasa) se suman como 0 en modos unified.
   */
  const sumInMode = (items, mode = viewMode) => {
    return items.reduce((acc, item) => {
      const val = getValueInMode(item.monto, item.moneda, mode)
      return acc + (val ?? 0)
    }, 0)
  }

  /**
   * Formatea un monto con el símbolo de la moneda activa.
   */
  const formatInMode = (amount, mode = viewMode) => {
    const isUSD = mode === 'USD' || mode === 'unified_USD'
    if (isUSD) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    }
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  /**
   * Formato específico para ARS (siempre, independiente del viewMode)
   */
  const formatARS = (amount) => new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)

  /**
   * Formato específico para USD (siempre, independiente del viewMode)
   */
  const formatUSD = (amount) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount)

  const value = {
    // Estado
    viewMode,
    setViewMode,
    // Datos del dólar MEP
    ...dolar,
    // Funciones de conversión
    convertToARS,
    convertToUSD,
    getValueInMode,
    sumInMode,
    // Funciones de formato
    formatInMode,
    formatARS,
    formatUSD,
    // Helpers del modo activo
    isARSMode: viewMode === 'ARS',
    isUSDMode: viewMode === 'USD',
    isUnifiedARS: viewMode === 'unified_ARS',
    isUnifiedUSD: viewMode === 'unified_USD',
    activeSymbol: (viewMode === 'USD' || viewMode === 'unified_USD') ? 'U$D' : '$',
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency debe usarse dentro de CurrencyProvider')
  return ctx
}

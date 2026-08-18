import { useState, useEffect, useCallback } from 'react'

const DOLAR_API_URL = 'https://dolarapi.com/v1/dolares'
const CACHE_KEY = 'dolar_cotizaciones_cache'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos

/**
 * Hook para obtener cotizaciones del dólar en Argentina via DolarAPI.
 * Cachea en sessionStorage por 5 minutos para evitar requests repetidos.
 * Por defecto usa el Dólar MEP (bolsa).
 */
export function useDolar(tipoCambioDefault = 'bolsa') {
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchCotizaciones = useCallback(async (force = false) => {
    // Intentar leer del cache
    if (!force) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < CACHE_TTL_MS) {
            setCotizaciones(data)
            setLastUpdated(new Date(timestamp))
            setLoading(false)
            return
          }
        }
      } catch {
        // Si el cache está corrupto, ignorarlo
      }
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(DOLAR_API_URL)
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
      const data = await res.json()
      setCotizaciones(data)
      const now = Date.now()
      setLastUpdated(new Date(now))
      // Guardar en cache
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: now }))
    } catch (err) {
      setError(err.message)
      // Si hay datos en cache (aunque viejos), usarlos como fallback
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          setCotizaciones(data)
          setLastUpdated(new Date(timestamp))
        }
      } catch {
        // Sin fallback disponible
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCotizaciones()
  }, [fetchCotizaciones])

  // Obtener una cotización específica por su casa (bolsa, blue, oficial, etc.)
  const getCotizacion = (casa) => cotizaciones.find(c => c.casa === casa) || null

  // Cotización seleccionada por defecto (MEP / bolsa)
  const cotizacionMEP = getCotizacion('bolsa')

  // Tasa de venta del tipo seleccionado
  const tasaVentaMEP = cotizacionMEP?.venta || null

  // Tiempo transcurrido desde la última actualización
  const tiempoActualizacion = lastUpdated
    ? Math.round((Date.now() - lastUpdated.getTime()) / 60000)
    : null

  return {
    cotizaciones,
    cotizacionMEP,
    tasaVentaMEP,
    getCotizacion,
    loading,
    error,
    lastUpdated,
    tiempoActualizacion,
    refetch: () => fetchCotizaciones(true),
  }
}

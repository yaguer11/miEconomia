// ----------------------------------------------------------------
// CATEGORÍAS DE GASTOS: datos predeterminados usados para el seed
// (se insertan en DB por usuario/familia al primer uso)
// ----------------------------------------------------------------
export const CATEGORIAS_DEFAULT = [
  {
    nombre: 'Alimentación', emoji: '🛒', color: '#f97316', orden: 1,
    subcategorias: [
      'Supermercado', 'Verdulería', 'Frutería', 'Carnicería', 'Pescadería',
      'Fiambrería', 'Panadería', 'Bebidas', 'Delivery', 'Restaurantes',
      'Comida rápida', 'Cafetería', 'Otros alimentos',
    ],
  },
  {
    nombre: 'Vivienda', emoji: '🏠', color: '#06b6d4', orden: 2,
    subcategorias: [
      'Alquiler', 'Impuesto inmobiliario', 'Mantenimiento',
      'Reparaciones', 'Pintura', 'Otros vivienda',
    ],
  },
  {
    nombre: 'Hogar', emoji: '🧹', color: '#84cc16', orden: 3,
    subcategorias: [
      'Productos de limpieza', 'Productos para lavar ropa', 'Muebles',
      'Electrodomésticos', 'Cocina', 'Ropa de cama', 'Toallas',
      'Decoración', 'Herramientas', 'Otros hogar',
    ],
  },
  {
    nombre: 'Hijos', emoji: '👶', color: '#ec4899', orden: 4,
    subcategorias: [
      'Pañales', 'Leche / Fórmula', 'Alimentos para bebé', 'Higiene',
      'Ropa', 'Calzado', 'Juguetes', 'Libros', 'Equipamiento',
      'Cumpleaños', 'Otros gastos del hijo',
    ],
  },
  {
    nombre: 'Transporte', emoji: '🚗', color: '#3b82f6', orden: 5,
    subcategorias: [
      'Combustible', 'Taxi', 'Uber', 'Estacionamiento', 'Peajes',
      'Mantenimiento', 'Repuestos', 'Neumáticos', 'Lavado', 'Seguro',
      'Patente', 'RTO', 'Multas', 'Compra de vehículo',
      'Otros gastos de transporte',
    ],
  },
  {
    nombre: 'Salud', emoji: '🏥', color: '#ef4444', orden: 6,
    subcategorias: [
      'Obra social', 'Farmacia', 'Medicamentos', 'Otros gastos de salud',
    ],
  },
  {
    nombre: 'Educación', emoji: '📚', color: '#8b5cf6', orden: 7,
    subcategorias: [
      'Universidad', 'Cursos', 'Otros gastos de educación',
    ],
  },
  {
    nombre: 'Ropa y calzado', emoji: '👕', color: '#f59e0b', orden: 8,
    subcategorias: [
      'Ropa', 'Calzado', 'Ropa interior', 'Ropa deportiva', 'Abrigos',
      'Accesorios', 'Carteras / Mochilas', 'Otros gastos de ropa',
    ],
  },
  {
    nombre: 'Tecnología', emoji: '💻', color: '#6366f1', orden: 9,
    subcategorias: [
      'Celular', 'Computadora', 'Aplicaciones', 'Servicios en la nube',
      'Suscripciones', 'Otros gastos de tecnología',
    ],
  },
  {
    nombre: 'Servicios', emoji: '📱', color: '#14b8a6', orden: 10,
    subcategorias: [
      'Electricidad', 'Gas', 'Agua', 'Internet', 'Telefonía celular',
      'Otros servicios',
    ],
  },
  {
    nombre: 'Entretenimiento', emoji: '🎬', color: '#e879f9', orden: 11,
    subcategorias: [
      'Cine', 'Eventos', 'Deportes', 'Juegos de mesa', 'Hobbies',
      'Salidas', 'Otros entretenimientos',
    ],
  },
  {
    nombre: 'Cuidado personal', emoji: '🧴', color: '#fb7185', orden: 12,
    subcategorias: [
      'Peluquería', 'Barbería', 'Cosmética', 'Perfumería',
      'Higiene personal', 'Maquillaje', 'Otros gastos personales',
    ],
  },
  {
    nombre: 'Finanzas', emoji: '💰', color: '#10b981', orden: 13,
    subcategorias: [
      'Mantenimiento de cuenta', 'Tarjeta de crédito', 'Inversiones',
      'Otros gastos financieros',
    ],
  },
  {
    nombre: 'Impuestos y trámites', emoji: '📄', color: '#94a3b8', orden: 14,
    subcategorias: [
      'Tasas municipales', 'Honorarios profesionales',
      'Otros impuestos y trámites',
    ],
  },
  {
    nombre: 'Viajes', emoji: '✈️', color: '#0ea5e9', orden: 15,
    subcategorias: [
      'Pasajes', 'Combustible', 'Alojamiento', 'Alquiler de vehículo',
      'Excursiones', 'Comidas', 'Transporte', 'Seguro de viaje',
      'Compras durante el viaje', 'Otros gastos de viaje',
    ],
  },
  {
    nombre: 'Regalos y eventos', emoji: '🎁', color: '#a855f7', orden: 16,
    subcategorias: [
      'Regalos', 'Cumpleaños', 'Casamientos', 'Bautismos', 'Fiestas',
      'Navidad', 'Día de la madre', 'Día del padre', 'Otros eventos',
    ],
  },
  {
    nombre: 'Otros', emoji: '📦', color: '#64748b', orden: 17,
    subcategorias: [
      'Compras varias', 'Gastos no clasificados',
    ],
  },
]

// Paleta de colores disponibles para el picker de categorías
export const COLORES_CATEGORIA = [
  '#f97316', '#ef4444', '#ec4899', '#a855f7', '#8b5cf6',
  '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6',
  '#10b981', '#84cc16', '#f59e0b', '#fb7185', '#e879f9',
  '#64748b', '#94a3b8',
]

// Emojis sugeridos para el picker de categorías
export const EMOJIS_CATEGORIA = [
  '🛒', '🏠', '🧹', '👶', '🚗', '🏥', '📚', '👕', '💻', '📱',
  '🎬', '🧴', '💰', '📄', '✈️', '🎁', '📦', '🍔', '🚕', '🎮',
  '🏋️', '🐾', '🌱', '🎓', '🏦', '🛍️', '🍷', '🎵', '⚽', '🔧',
]

// ----------------------------------------------------------------
// Mantener compatibilidad con código legacy que usa CATEGORIAS
// (para gastos históricos que aún tienen el campo texto)
// ----------------------------------------------------------------
export const CATEGORIAS = [
  { id: 'comida',          label: 'Comida y bebida',   emoji: '🍔', color: '#f97316' },
  { id: 'transporte',      label: 'Transporte',        emoji: '🚗', color: '#3b82f6' },
  { id: 'salud',           label: 'Salud',             emoji: '💊', color: '#ef4444' },
  { id: 'educacion',       label: 'Educación',         emoji: '📚', color: '#8b5cf6' },
  { id: 'entretenimiento', label: 'Entretenimiento',   emoji: '🎬', color: '#ec4899' },
  { id: 'hogar',           label: 'Hogar',             emoji: '🏠', color: '#06b6d4' },
  { id: 'ropa',            label: 'Ropa',              emoji: '👕', color: '#84cc16' },
  { id: 'tecnologia',      label: 'Tecnología',        emoji: '💻', color: '#6366f1' },
  { id: 'servicios',       label: 'Servicios',         emoji: '📱', color: '#14b8a6' },
  { id: 'otros',           label: 'Otros',             emoji: '📦', color: '#94a3b8' },
]

export const getCategoriaById = (id) =>
  CATEGORIAS.find(c => c.id === id) || { id, label: id, emoji: '📦', color: '#94a3b8' }

// ----------------------------------------------------------------
// CATEGORÍAS DE INGRESOS (sin cambios)
// ----------------------------------------------------------------
export const CATEGORIAS_INGRESOS = [
  { id: 'salario',     label: 'Salario',       emoji: '💼',  color: '#10b981' },
  { id: 'freelance',   label: 'Freelance',     emoji: '🧑‍💻', color: '#6366f1' },
  { id: 'inversiones', label: 'Inversiones',   emoji: '📈',  color: '#f59e0b' },
  { id: 'venta',       label: 'Venta',         emoji: '🛍️',  color: '#3b82f6' },
  { id: 'bono',        label: 'Bono / Premio', emoji: '🏆',  color: '#ec4899' },
  { id: 'alquiler',    label: 'Alquiler',      emoji: '🏘️',  color: '#06b6d4' },
  { id: 'regalo',      label: 'Regalo',        emoji: '🎁',  color: '#84cc16' },
  { id: 'reembolso',   label: 'Reembolso',     emoji: '↩️',  color: '#14b8a6' },
  { id: 'otros',       label: 'Otros',         emoji: '💰',  color: '#94a3b8' },
]

export const getCategIngresosById = (id) =>
  CATEGORIAS_INGRESOS.find(c => c.id === id) || { id, label: id, emoji: '💰', color: '#94a3b8' }

// ----------------------------------------------------------------
// UTILIDADES DE FORMATO
// ----------------------------------------------------------------
export const formatMoney = (amount) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)

export const formatMoneyUSD = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount)

export const formatMoneyByCurrency = (amount, moneda = 'ARS') =>
  moneda === 'USD' ? formatMoneyUSD(amount) : formatMoney(amount)

export const formatDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export const TIPOS_CAMBIO = [
  { casa: 'bolsa',           label: 'Dólar MEP (Bolsa)',  emoji: '📊' },
  { casa: 'oficial',         label: 'Dólar Oficial',      emoji: '🏛️' },
  { casa: 'blue',            label: 'Dólar Blue',         emoji: '💵' },
  { casa: 'contadoconliqui', label: 'Dólar CCL',          emoji: '💹' },
  { casa: 'cripto',          label: 'Dólar Cripto',       emoji: '🔐' },
  { casa: 'tarjeta',         label: 'Dólar Tarjeta',      emoji: '💳' },
]

export const i18n = {
  // Búsqueda
  buscar: 'Buscar',
  limpiar: 'Limpiar',
  campoBusquedaVacio: 'Escribe un término antes de buscar.',
  terminoInvalido: 'El término ingresado no es válido.',
  sinResultados: 'No se encontraron resultados para «{term}».',
  numeroInexistente: 'No existe ninguna criatura con ese número.',
  volverAlCatalogo: 'Volver al catálogo completo',
  limpiarBusqueda: 'Limpiar búsqueda',
  limpiarFiltros: 'Limpiar filtros',

  // Estados de carga y error
  cargando: 'Cargando…',
  errorCarga: 'No se pudieron cargar los datos. Intenta de nuevo.',
  tiempoAgotado: 'La solicitud tardó demasiado. Intenta de nuevo.',
  reintentar: 'Reintentar',

  // Catálogo y paginación
  paginaDeTotal: 'Página {page} de {total}',
  anterior: 'Anterior',
  siguiente: 'Siguiente',
  sinImagenDisponible: 'Sin imagen disponible',

  // Ficha
  volver: 'Volver',
  numero: 'N.º',
  altura: 'Altura',
  peso: 'Peso',
  tipos: 'Tipos',
  habilidades: 'Habilidades',
  estadisticasBase: 'Estadísticas base',

  // Habilidades
  descripcionNoDisponibleEs: 'Descripción no disponible en español.',
  cerrar: 'Cerrar',

  // Comparación
  comparar: 'Comparar',
  seleccionaCriatura: 'Selecciona una criatura',
  iniciarComparacion: 'Comparar',
  creaturasIguales: 'Debes seleccionar dos criaturas diferentes.',
  mayor: '▲',
  empate: '=',
  slotA: 'Criatura A',
  slotB: 'Criatura B',

  // Filtros
  filtrarPorTipo: 'Filtrar por tipo',
  tipoMaximos: 'Cada criatura tiene como máximo 2 tipos.',
  tipoMaximosAnd: 'Con 2 tipos se muestran criaturas que tengan AMBOS.',
  sinResultadosFiltro: 'No hay criaturas para esta combinación.',

  // Habilidades — etiqueta de oculta
  habilidadOculta: '(oculta)',

  // Comparación — labels de slots y selector
  labelSlotA: 'Criatura A:',
  labelSlotB: 'Criatura B:',
  seleccionaOpcion: '— Elige una criatura —',
  volverAlCatalogoBtn: '← Volver al catálogo',
} as const;

/** Mapa de tipos en inglés → nombre en español para la UI */
export const tipoEnEs: Record<string, string> = {
  normal: 'Normal',
  fire: 'Fuego',
  water: 'Agua',
  electric: 'Eléctrico',
  grass: 'Planta',
  ice: 'Hielo',
  fighting: 'Lucha',
  poison: 'Veneno',
  ground: 'Tierra',
  flying: 'Volador',
  psychic: 'Psíquico',
  bug: 'Bicho',
  rock: 'Roca',
  ghost: 'Fantasma',
  dragon: 'Dragón',
  dark: 'Siniestro',
  steel: 'Acero',
  fairy: 'Hada',
};

export type I18nKey = keyof typeof i18n;

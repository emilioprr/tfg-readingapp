/** Nota media de un libro, siempre con un decimal: 4,2 · 3,9. */
export const formatoMedia = (n) => Number(n).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

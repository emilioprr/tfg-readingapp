/** Ritmo de lectura en tres niveles: los rayos y la frase salen siempre del mismo nivel. */
export const FRASES_RITMO = ['', 'Se lee con calma', 'Se lee con soltura', 'Se lee de un tirón']

/** Redondea un ritmo (o la media de varios) a su nivel, de 1 a 3. */
export const nivelRitmo = (r) => Math.min(3, Math.max(1, Math.round(r)))

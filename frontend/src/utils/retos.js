/** Progreso de un reto con su unidad: "3 / 10" o, en los de horas (guardados en minutos), "1.5 / 10 h". */
export const formatoProgreso = (tipo, progreso = 0, meta = 0) =>
    tipo === 'HORAS' ? `${(progreso / 60).toFixed(1)} / ${meta} h` : `${progreso} / ${meta}`

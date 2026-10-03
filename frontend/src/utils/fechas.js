/** Fecha y hora cortas para avisos: "Hoy, 10:05", "Ayer, 18:30" o "29 sept, 10:05" (con el año si no es el actual). */
export function fechaHoraCorta(fechaIso) {
    const fecha = new Date(fechaIso)
    const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const dia = new Date(fecha); dia.setHours(0, 0, 0, 0)
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const dias = Math.round((hoy - dia) / 86400000)
    if (dias === 0) return `Hoy, ${hora}`
    if (dias === 1) return `Ayer, ${hora}`
    const opciones = { day: 'numeric', month: 'short', ...(fecha.getFullYear() !== hoy.getFullYear() && { year: 'numeric' }) }
    return `${fecha.toLocaleDateString('es-ES', opciones)}, ${hora}`
}

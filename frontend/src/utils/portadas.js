/**
 * Limpia las URLs de portada de Google Books: fuerza https (evita contenido mixto)
 * y quita "edge=curl", que dibuja la esquina doblada sobre la portada.
 */
export function mejorarPortada(url) {
    if (!url) return url
    return url
        .replace(/^http:\/\//i, 'https://')
        .replace(/[?&]edge=curl/gi, (m) => (m.startsWith('?') ? '?' : ''))
        .replace(/\?&/, '?')
}

import { Link } from 'react-router-dom'
import logoBookmark from '../assets/logo.png';

export default function Landing() {
    return (
        <div className="min-h-screen bg-dark-base">
            {/* Navbar */}
            <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-white text-2xl font-bold tracking-tight flex items-center gap-1">
            Bookmark
            <img alt="Logo Bookmark" src={logoBookmark} className="w-9 h-9 object-contain" />
          </span>
                    <div className="flex items-center gap-6">
                        <Link to="/login" className="text-dark-text/80 hover:text-dark-text text-sm font-medium transition-colors">
                            Iniciar sesión
                        </Link>
                        <Link to="/registro" className="bg-terra hover:bg-terra-hover text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
                            Crear cuenta
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-8 gap-1 opacity-15 blur-sm scale-110">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="bg-dark-elevated rounded aspect-[2/3]" />
                    ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-dark-base/60 via-dark-base/40 to-dark-base" />

                <div className="relative z-10 text-center px-6 max-w-3xl">
                    <h1 className="text-6xl md:text-7xl font-bold text-dark-text tracking-tight leading-tight mb-6">
                        Lleva el control de<br />
                        <span className="text-terra">tus lecturas.</span>
                    </h1>
                    <p className="text-xl text-dark-muted leading-relaxed mb-4">
                        Guarda los libros que lees. Comparte lo que te gusta.
                    </p>
                    <p className="text-xl text-dark-muted leading-relaxed mb-10">
                        Descubre qué leen tus amigos.
                    </p>
                    <Link to="/registro"
                          className="bg-terra hover:bg-terra-hover text-white font-semibold px-10 py-4 rounded-lg text-lg transition-colors inline-block">
                        Empieza gratis
                    </Link>
                </div>
            </div>

            {/* Features */}
            <div className="max-w-5xl mx-auto px-6 py-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="text-center">
                        <div className="text-4xl mb-4">📚</div>
                        <h3 className="text-lg font-semibold text-dark-text mb-2">Seguimiento de lectura</h3>
                        <p className="text-dark-muted text-sm leading-relaxed">
                            Marca lo que estás leyendo, registra tu progreso página a página y lleva un historial completo de tus lecturas.
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl mb-4">⭐</div>
                        <h3 className="text-lg font-semibold text-dark-text mb-2">Reseñas con estilo</h3>
                        <p className="text-dark-muted text-sm leading-relaxed">
                            Puntúa con medias estrellas, marca el ritmo y etiqueta el estado de ánimo del libro. Comparte o guarda en privado.
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl mb-4">👥</div>
                        <h3 className="text-lg font-semibold text-dark-text mb-2">Comunidad lectora</h3>
                        <p className="text-dark-muted text-sm leading-relaxed">
                            Sigue a otros lectores, recomienda libros directamente y participa en retos de lectura con amigos.
                        </p>
                    </div>
                </div>
            </div>

            {/* Diferenciadores */}
            <div className="bg-dark-card border-t border-dark-border">
                <div className="max-w-5xl mx-auto px-6 py-24">
                    <h2 className="text-3xl font-bold text-dark-text text-center mb-16 tracking-tight">
                        No es solo otra app de libros.
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-dark-elevated rounded-2xl p-6">
                            <h3 className="text-terra font-semibold mb-2">Reseñas que dicen algo</h3>
                            <p className="text-dark-muted text-sm leading-relaxed">
                                Medias estrellas, ritmo de lectura con rayos y etiquetas de estado de ánimo. No solo un número: una impresión completa.
                            </p>
                        </div>
                        <div className="bg-dark-elevated rounded-2xl p-6">
                            <h3 className="text-terra font-semibold mb-2">Retos con amigos</h3>
                            <p className="text-dark-muted text-sm leading-relaxed">
                                Crea retos personales o compártelos. Por páginas, horas, libros o por autor. Tu progreso se actualiza automáticamente.
                            </p>
                        </div>
                        <div className="bg-dark-elevated rounded-2xl p-6">
                            <h3 className="text-terra font-semibold mb-2">Recomendaciones directas</h3>
                            <p className="text-dark-muted text-sm leading-relaxed">
                                Recomienda libros a tus amigos en un chat privado. Sin algoritmos, solo personas que conoces.
                            </p>
                        </div>
                        <div className="bg-dark-elevated rounded-2xl p-6">
                            <h3 className="text-terra font-semibold mb-2">Notas y citas</h3>
                            <p className="text-dark-muted text-sm leading-relaxed">
                                Anota tus reflexiones y guarda citas memorables mientras lees. Privadas o compartidas con la comunidad.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA final */}
            <div className="max-w-5xl mx-auto px-6 py-24 text-center">
                <h2 className="text-4xl font-bold text-dark-text mb-4 tracking-tight">
                    ¿Listo para empezar?
                </h2>
                <p className="text-dark-muted text-lg mb-8">
                    Únete a la comunidad de lectores que llevan sus libros con estilo.
                </p>
                <Link to="/registro"
                      className="bg-terra hover:bg-terra-hover text-white font-semibold px-10 py-4 rounded-lg text-lg transition-colors inline-block">
                    Crear cuenta gratis
                </Link>
            </div>

            {/* Footer */}
            <footer className="border-t border-dark-border py-8 px-6">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-white font-bold flex items-center gap-1">
            Bookmark
            <img alt="Logo Bookmark" src={logoBookmark} className="w-6 h-6 object-contain" />
          </span>
                    <p className="text-dark-muted text-sm">© 2026. Trabajo de Fin de Grado — UDC</p>
                </div>
            </footer>
        </div>
    )
}
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const QUE_HACE = [
    ['Seguimiento de lectura', 'Marca lo que estás leyendo, apunta la página por la que vas y guarda el historial de todo lo que has terminado.'],
    ['Reseñas que dicen algo', 'Medias estrellas, el ritmo del libro y su ambiente. No solo un número: la impresión completa. Pública o solo para ti.'],
    ['Comunidad lectora', 'Sigue a otros lectores, recomienda libros de persona a persona y comparte retos de lectura con amigos.'],
]

const DIFERENCIAS = [
    ['Retos con amigos', 'Personales o compartidos: por libros, páginas u horas. El progreso se actualiza solo mientras lees.'],
    ['Recomendaciones directas', 'Pásale un libro a alguien en una conversación privada. Sin algoritmos, solo personas que conoces.'],
    ['Notas y citas', 'Anota lo que piensas y guarda las frases que te marcan mientras lees. Privadas o compartidas con la comunidad.'],
    ['Tu mural de citas', 'Cuelga en tu perfil las citas que más te han dicho, tuyas o de otros lectores.'],
]

export default function Landing() {
    return (
        <div className="min-h-screen bg-fondo">
            <Navbar />

            {/* Portada */}
            <section className="max-w-4xl mx-auto px-6 pt-24 pb-28 sm:pt-32 sm:pb-36 text-center">
                <p className="etiqueta mb-6">Tu cuaderno de lectura</p>
                <h1 className="font-serif text-5xl sm:text-7xl leading-[1.02] tracking-tight text-texto">
                    Cada libro es un mundo.<br />
                    <em className="text-texto-sec">Construye el tuyo.</em>
                </h1>
                <p className="text-lg text-texto-sec leading-relaxed mt-8 max-w-xl mx-auto">
                    Guarda lo que lees, comparte lo que te gusta y descubre qué están leyendo tus amigos.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
                    <Link to="/registro" className="btn-acento px-6 py-3 text-base">Empieza gratis</Link>
                    <Link to="/catalogo" className="btn-secundario px-6 py-3 text-base">Explorar libros</Link>
                </div>
            </section>

            {/* Qué hace */}
            <section className="border-t border-linea">
                <div className="max-w-5xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-0 md:divide-x divide-linea">
                    {QUE_HACE.map(([titulo, texto], i) => (
                        <div key={titulo} className="md:px-8 first:md:pl-0 last:md:pr-0">
                            <p className="font-serif text-texto-ter text-lg mb-3 tabular-nums">{String(i + 1).padStart(2, '0')}</p>
                            <h3 className="font-serif text-2xl text-texto mb-3">{titulo}</h3>
                            <p className="text-texto-sec text-sm leading-relaxed">{texto}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Diferencias */}
            <section className="border-t border-linea">
                <div className="max-w-5xl mx-auto px-6 py-20">
                    <h2 className="font-serif text-4xl sm:text-5xl tracking-tight text-texto mb-14">No es solo otra app de libros.</h2>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
                        {DIFERENCIAS.map(([titulo, texto]) => (
                            <div key={titulo} className="border-t border-linea py-6">
                                <dt className="font-serif text-xl text-texto mb-2">{titulo}</dt>
                                <dd className="text-texto-sec text-sm leading-relaxed">{texto}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            {/* Llamada final */}
            <section className="border-t border-linea">
                <div className="max-w-3xl mx-auto px-6 py-24 text-center">
                    <h2 className="font-serif text-4xl sm:text-5xl tracking-tight text-texto">¿Empezamos?</h2>
                    <p className="text-texto-sec text-lg mt-4 mb-10">Tu próxima lectura ya te está esperando.</p>
                    <Link to="/registro" className="btn-acento px-6 py-3 text-base">Crear cuenta gratis</Link>
                </div>
            </section>

            <footer className="border-t border-linea py-8 px-6">
                <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
                    <span className="font-serif text-xl text-texto">Bookmark</span>
                    <p className="text-texto-ter text-sm">© 2026 · Trabajo de Fin de Grado · UDC</p>
                </div>
            </footer>
        </div>
    )
}

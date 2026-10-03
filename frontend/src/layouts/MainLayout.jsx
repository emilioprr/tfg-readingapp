import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ToastNotificaciones from '../components/ToastNotificaciones'
import { RachaCelebracion } from '../components/Racha'
import Cargando from '../components/Cargando'

export default function MainLayout() {
    return (
        <div className="min-h-screen bg-fondo text-texto">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Mientras llega el código de la pantalla, la barra sigue en su sitio */}
                <Suspense fallback={<Cargando />}>
                    <Outlet />
                </Suspense>
            </main>
            <ToastNotificaciones />
            <RachaCelebracion />
        </div>
    )
}
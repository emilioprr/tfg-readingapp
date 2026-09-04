import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function MainLayout() {
    return (
        <div className="min-h-screen bg-dark-base text-dark-text">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 py-8">
                <Outlet />
            </main>
        </div>
    )
}
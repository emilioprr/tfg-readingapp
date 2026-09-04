import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Catalogo from './pages/Catalogo'
import LibroDetalle from './pages/LibroDetalle'
import Perfil from './pages/Perfil'
import AutorDetalle from './pages/AutorDetalle'
import Notificaciones from './pages/Notificaciones'
import Retos from './pages/Retos'
import CrearResena from './pages/CrearResena'
import RegistrarSeguimiento from './pages/RegistrarSeguimiento'
import ListaDetalle from './pages/ListaDetalle'
import CrearLista from './pages/CrearLista'
import Recomendaciones from './pages/Recomendaciones'
import EnviarRecomendacion from './pages/EnviarRecomendacion'
import CrearAnotacion from './pages/CrearAnotacion'
import CrearReto from './pages/CrearReto'
import EditarPerfil from './pages/EditarPerfil'
import Admin from './pages/Admin'
import Inicio from './pages/Inicio'
import MisResenas from './pages/MisResenas'
import MiWishlist from './pages/MiWishlist'
import MisLikes from './pages/MisLikes'
import Busqueda from './pages/Busqueda'
import Listas from './pages/Listas'


function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/landing" element={<Landing />} />
                    <Route element={<MainLayout />}>
                        <Route path="/login" element={<Login />} />
                        <Route path="/registro" element={<Registro />} />
                        <Route path="/catalogo" element={<Catalogo />} />
                        <Route path="/libro/:id" element={<LibroDetalle />} />
                        <Route path="/perfil" element={<Perfil />} />
                        <Route path="/autor/:id" element={<AutorDetalle />} />
                        <Route path="/notificaciones" element={<Notificaciones />} />
                        <Route path="/retos" element={<Retos />} />
                        <Route path="/libro/:idlibro/resena" element={<CrearResena />} />
                        <Route path="/libro/:idlibro/seguimiento" element={<RegistrarSeguimiento />} />
                        <Route path="/lista/:id" element={<ListaDetalle />} />
                        <Route path="/crear-lista" element={<CrearLista />} />
                        <Route path="/buscar" element={<Busqueda />} />
                        <Route path="/usuario/:id" element={<Perfil />} />
                        <Route path="/recomendaciones" element={<Recomendaciones />} />
                        <Route path="/libro/:idlibro/recomendar" element={<EnviarRecomendacion />} />
                        <Route path="/libro/:idlibro/anotaciones" element={<CrearAnotacion />} />
                        <Route path="/crear-reto" element={<CrearReto />} />
                        <Route path="/editar-perfil" element={<EditarPerfil />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/" element={<Inicio />} />
                        <Route path="/mis-resenas" element={<MisResenas />} />
                        <Route path="/mi-wishlist" element={<MiWishlist />} />
                        <Route path="/mis-likes" element={<MisLikes />} />
                        <Route path="/listas" element={<Listas />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
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
import BuscarUsuarios from './pages/BuscarUsuarios'
import UsuarioPerfil from './pages/UsuarioPerfil'
import Recomendaciones from './pages/Recomendaciones'
import EnviarRecomendacion from './pages/EnviarRecomendacion'
import CrearAnotacion from './pages/CrearAnotacion'
import CrearReto from './pages/CrearReto'
import EditarPerfil from './pages/EditarPerfil'
import Admin from './pages/Admin'
import Inicio from './pages/Inicio'


function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
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
                        <Route path="/buscar-usuarios" element={<BuscarUsuarios />} />
                        <Route path="/usuario/:id" element={<UsuarioPerfil />} />
                        <Route path="/recomendaciones" element={<Recomendaciones />} />
                        <Route path="/libro/:idlibro/recomendar" element={<EnviarRecomendacion />} />
                        <Route path="/libro/:idlibro/anotaciones" element={<CrearAnotacion />} />
                        <Route path="/crear-reto" element={<CrearReto />} />
                        <Route path="/editar-perfil" element={<EditarPerfil />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/" element={<Inicio />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
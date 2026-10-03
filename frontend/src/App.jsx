import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
import { RachaProvider } from './context/RachaContext'
import { NotificacionesProvider } from './context/NotificacionesContext'
import { AvisosProvider } from './context/AvisosContext'
import Cargando from './components/Cargando'

// Cada pantalla va en su propio archivo y se descarga la primera vez que se abre (code splitting por rutas)
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Registro = lazy(() => import('./pages/Registro'))
const Catalogo = lazy(() => import('./pages/Catalogo'))
const LibroDetalle = lazy(() => import('./pages/LibroDetalle'))
const Perfil = lazy(() => import('./pages/Perfil'))
const AutorDetalle = lazy(() => import('./pages/AutorDetalle'))
const Notificaciones = lazy(() => import('./pages/Notificaciones'))
const Retos = lazy(() => import('./pages/Retos'))
const CrearResena = lazy(() => import('./pages/CrearResena'))
const ListaDetalle = lazy(() => import('./pages/ListaDetalle'))
const CrearLista = lazy(() => import('./pages/CrearLista'))
const Recomendaciones = lazy(() => import('./pages/Recomendaciones'))
const CategoriaCatalogo = lazy(() => import('./pages/CategoriaCatalogo'))
const Conexiones = lazy(() => import('./pages/Conexiones'))
const Ajustes = lazy(() => import('./pages/Ajustes'))
const Citas = lazy(() => import('./pages/Citas'))
const Actividad = lazy(() => import('./pages/Actividad'))
const EnviarRecomendacion = lazy(() => import('./pages/EnviarRecomendacion'))
const CrearAnotacion = lazy(() => import('./pages/CrearAnotacion'))
const CrearReto = lazy(() => import('./pages/CrearReto'))
const EditarPerfil = lazy(() => import('./pages/EditarPerfil'))
const Admin = lazy(() => import('./pages/Admin'))
const Inicio = lazy(() => import('./pages/Inicio'))
const MisResenas = lazy(() => import('./pages/MisResenas'))
const MisLikes = lazy(() => import('./pages/MisLikes'))
const Busqueda = lazy(() => import('./pages/Busqueda'))
const Listas = lazy(() => import('./pages/Listas'))
const ResenaDetalle = lazy(() => import('./pages/ResenaDetalle'))
const Calendario = lazy(() => import('./pages/Calendario'))
const Timer = lazy(() => import('./pages/Timer'))
const EditarLibro = lazy(() => import('./pages/EditarLibro'))
const Resenas = lazy(() => import('./pages/Resenas'))
const EstanteriaCompleta = lazy(() => import('./pages/EstanteriaCompleta'))
const ResenasLibro = lazy(() => import('./pages/ResenasLibro'))

function App() {
    return (
        <AuthProvider>
            <RachaProvider>
            <NotificacionesProvider>
            <AvisosProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/landing" element={<Suspense fallback={<Cargando pantalla />}><Landing/></Suspense>}/>
                        <Route element={<MainLayout/>}>
                            <Route path="/login" element={<Login/>}/>
                            <Route path="/registro" element={<Registro/>}/>
                            <Route path="/catalogo" element={<Catalogo/>}/>
                            <Route path="/catalogo/categoria/:slug" element={<CategoriaCatalogo/>}/>
                            <Route path="/libro/:id" element={<LibroDetalle/>}/>
                            <Route path="/perfil" element={<Perfil/>}/>
                            <Route path="/conexiones" element={<Conexiones/>}/>
                            <Route path="/ajustes" element={<Ajustes/>}/>
                            <Route path="/citas" element={<Citas/>}/>
                            <Route path="/actividad" element={<Actividad/>}/>
                            <Route path="/autor/:id" element={<AutorDetalle/>}/>
                            <Route path="/notificaciones" element={<Notificaciones/>}/>
                            <Route path="/retos" element={<Retos/>}/>
                            <Route path="/libro/:idlibro/resena" element={<CrearResena/>}/>
                            <Route path="/lista/:id" element={<ListaDetalle/>}/>
                            <Route path="/crear-lista" element={<CrearLista/>}/>
                            <Route path="/buscar" element={<Busqueda/>}/>
                            <Route path="/usuario/:id" element={<Perfil/>}/>
                            <Route path="/recomendaciones" element={<Recomendaciones/>}/>
                            <Route path="/libro/:idlibro/recomendar" element={<EnviarRecomendacion/>}/>
                            <Route path="/libro/:idlibro/anotaciones" element={<CrearAnotacion/>}/>
                            <Route path="/crear-reto" element={<CrearReto/>}/>
                            <Route path="/editar-perfil" element={<EditarPerfil/>}/>
                            <Route path="/admin" element={<Admin/>}/>
                            <Route path="/" element={<Inicio/>}/>
                            <Route path="/mis-resenas" element={<MisResenas/>}/>
                            <Route path="/mis-likes" element={<MisLikes/>}/>
                            <Route path="/listas" element={<Listas/>}/>
                            <Route path="/resena/:id" element={<ResenaDetalle/>}/>
                            <Route path="/calendario" element={<Calendario/>}/>
                            <Route path="/timer" element={<Timer/>}/>
                            <Route path="/libro/:id/editar" element={<EditarLibro/>}/>
                            <Route path="/resenas" element={<Resenas/>}/>
                            <Route path="/estanteria/:idusuario/:estado" element={<EstanteriaCompleta/>}/>
                            <Route path="/libro/:id/resenas" element={<ResenasLibro/>}/>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AvisosProvider>
            </NotificacionesProvider>
            </RachaProvider>
        </AuthProvider>
    )
}

export default App
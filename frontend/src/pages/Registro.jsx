import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Registro() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [nombre, setNombre] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            const res = await api.post('/auth/registro', { nombre, email, password })
            // Misma forma de iniciar sesión que en Login: el contexto guarda el token y el usuario
            login(res.data)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al registrarse')
        }
    }

    return (
        <div className="flex justify-center pt-12 sm:pt-20">
            <form onSubmit={handleSubmit} className="w-full max-w-sm">
                <h1 className="font-serif text-4xl sm:text-5xl leading-none tracking-tight text-texto text-center">Crear cuenta</h1>
                <p className="text-texto-sec text-sm text-center mt-3 mb-10">Lleva la cuenta de lo que lees y lo que te dejan los libros.</p>
                {error && <p className="text-error text-sm mb-5 text-center">{error}</p>}
                <div className="mb-5">
                    <label className="etiqueta block mb-2">Nombre</label>
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                           className="campo" required />
                </div>
                <div className="mb-5">
                    <label className="etiqueta block mb-2">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                           className="campo" required />
                </div>
                <div className="mb-8">
                    <label className="etiqueta block mb-2">Contraseña</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6}
                           className="campo" required />
                    <p className="text-texto-ter text-xs mt-1.5">Mínimo 6 caracteres</p>
                </div>
                <button type="submit" className="btn-acento w-full py-2.5">Registrarse</button>
                <p className="text-texto-sec text-sm mt-6 text-center">
                    ¿Ya tienes cuenta? <Link to="/login" className="text-texto underline underline-offset-4 decoration-texto-ter hover:decoration-texto">Inicia sesión</Link>
                </p>
            </form>
        </div>
    )
}
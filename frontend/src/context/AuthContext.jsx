import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(() => {
        const saved = localStorage.getItem('usuario')
        return saved ? JSON.parse(saved) : null
    })

    const login = (datos) => {
        localStorage.setItem('token', datos.token)
        localStorage.setItem('usuario', JSON.stringify({
            id: parseInt(datos.idusuario),
            nombre: datos.nombre,
            email: datos.email,
            rol: datos.rol,
        }))
        setUsuario({ id: parseInt(datos.idusuario), nombre: datos.nombre, email: datos.email, rol: datos.rol })
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        setUsuario(null)
    }

    return (
        <AuthContext.Provider value={{ usuario, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
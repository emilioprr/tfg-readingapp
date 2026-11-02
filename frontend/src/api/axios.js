import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // 401 = token caducado o inválido; un 403 (sin permiso) no cierra la sesión
        if (error.response && error.response.status === 401) {
            const sinToken = !localStorage.getItem('token')
            const esRutaPublica = error.config.url?.includes('/auth/')

            if (!esRutaPublica && !sinToken) {
                localStorage.removeItem('token')
                localStorage.removeItem('usuario')
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export default api
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lh_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('lh_token')
      localStorage.removeItem('lh_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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
    const url = error.config?.url || ''
    const isAuthEndpoint = url.startsWith('/auth/')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export function getEventPassword(accessCode) {
  return localStorage.getItem(`event_password_${accessCode}`) || ''
}

export function setEventPassword(accessCode, password) {
  localStorage.setItem(`event_password_${accessCode}`, password)
}

export function eventApi(accessCode) {
  return {
    get: (url, config = {}) => api.get(url, {
      ...config,
      headers: { ...config.headers, 'X-Event-Password': getEventPassword(accessCode) },
    }),
    post: (url, data, config = {}) => api.post(url, data, {
      ...config,
      headers: { ...config.headers, 'X-Event-Password': getEventPassword(accessCode) },
    }),
  }
}

export default api

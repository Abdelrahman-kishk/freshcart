import axios from 'axios'
export const TOKEN_KEY = 'fc_token'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'https://ecommerce.routemisr.com/api/v1' })
// The Route API reads the JWT from a `token` header; Authorization is sent too for Bearer-style backends.
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem(TOKEN_KEY)
  if (t) { cfg.headers.token = t; cfg.headers.Authorization = `Bearer ${t}` }
  return cfg
})
api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
    localStorage.removeItem(TOKEN_KEY); window.dispatchEvent(new Event('fc:logout'))
  }
  err.userMessage = err.response?.data?.message || err.response?.data?.errors?.msg || err.message
  return Promise.reject(err)
})
export default api

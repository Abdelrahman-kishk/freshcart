import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import api, { TOKEN_KEY } from '../api'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const decode = t => { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) } catch { return null } }
const EMPTY_CART = { id: null, items: [], total: 0, count: 0 }
const normCart = res => {
  const d = res.data?.data
  return d ? { id: d._id, items: d.products || [], total: d.totalCartPrice || 0, count: res.data.numOfCartItems ?? (d.products || []).length } : EMPTY_CART
}

export function AppProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(() => read('fc_user', null))
  // cached copies render instantly on F5, then are re-synced from the server
  const [cart, setCart] = useState(() => read('fc_cart', EMPTY_CART))
  const [wishlist, setWishlist] = useState(() => read('fc_wish', []))
  const [busy, setBusy] = useState(false)

  useEffect(() => localStorage.setItem('fc_cart', JSON.stringify(cart)), [cart])
  useEffect(() => localStorage.setItem('fc_wish', JSON.stringify(wishlist)), [wishlist])

  const sync = useCallback(async () => {
    try {
      const [c, w] = await Promise.all([api.get('/cart').catch(e => e.response?.status === 404 ? { data: {} } : Promise.reject(e)), api.get('/wishlist')])
      setCart(normCart(c)); setWishlist((w.data.data || []).map(p => p._id || p))
    } catch { /* cached state stays visible */ }
  }, [])
  useEffect(() => { if (token) sync() }, [token, sync])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY); ['fc_user', 'fc_cart', 'fc_wish'].forEach(k => localStorage.removeItem(k))
    setToken(null); setUser(null); setCart(EMPTY_CART); setWishlist([])
  }, [])
  useEffect(() => { window.addEventListener('fc:logout', logout); return () => window.removeEventListener('fc:logout', logout) }, [logout])

  const login = (tok, u) => {
    localStorage.setItem(TOKEN_KEY, tok); const profile = { ...u, id: decode(tok)?.id }
    localStorage.setItem('fc_user', JSON.stringify(profile)); setToken(tok); setUser(profile)
  }
  const run = async (fn, ok) => {
    setBusy(true)
    try { const r = await fn(); if (ok) toast.success(ok); return r } catch (e) { toast.error(e.userMessage) } finally { setBusy(false) }
  }
  const removeItem = id => run(async () => setCart(normCart(await api.delete(`/cart/${id}`))), 'Removed from cart')
  const addToCart = id => run(async () => setCart(normCart(await api.post('/cart', { productId: id }))), 'Added to cart')
  const setQty = (id, count) => count < 1 ? removeItem(id) : run(async () => setCart(normCart(await api.put(`/cart/${id}`, { count }))))
  const clearCart = () => run(async () => { await api.delete('/cart'); setCart(EMPTY_CART) }, 'Cart cleared')
  const toggleWish = id => {
    const has = wishlist.includes(id)
    setWishlist(w => has ? w.filter(x => x !== id) : [...w, id]) // optimistic
    return (has ? api.delete(`/wishlist/${id}`) : api.post('/wishlist', { productId: id }))
      .then(() => toast.success(has ? 'Removed from wishlist' : 'Saved to wishlist'))
      .catch(e => { setWishlist(w => has ? [...w, id] : w.filter(x => x !== id)); toast.error(e.userMessage) })
  }
  const value = useMemo(() => ({ token, user, cart, wishlist, busy, login, logout, sync, addToCart, setQty, removeItem, clearCart, toggleWish }), [token, user, cart, wishlist, busy])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

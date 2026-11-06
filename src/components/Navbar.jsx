import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Navbar() {
  const { token, user, cart, wishlist, logout } = useApp(); const [open, setOpen] = useState(false)
  const L = ({ to, children }) => <NavLink to={to} onClick={() => setOpen(false)}>{children}</NavLink>
  return (
    <header className="nav"><div className="wrap bar">
      <Link to="/" className="logo">FreshCart</Link>
      <button className="burger" aria-label="Menu" onClick={() => setOpen(!open)}>☰</button>
      <nav className={open ? 'open' : ''}>
        <L to="/">Home</L><L to="/products">Products</L><L to="/categories">Categories</L><L to="/brands">Brands</L>
        {token ? <>
          <L to="/wishlist">Wishlist ({wishlist.length})</L><L to="/cart">Cart <span className="badge">{cart.count}</span></L>
          <L to="/orders">Orders</L><L to="/account">{user?.name?.split(' ')[0] || 'Account'}</L>
          <button className="link" onClick={logout}>Sign out</button></> : <><L to="/login">Sign in</L><L to="/register">Create account</L></>}
      </nav></div></header>
  )
}

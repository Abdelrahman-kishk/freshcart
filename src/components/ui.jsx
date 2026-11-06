import { Link, Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export const Guard = ({ children }) => { const { token } = useApp(); const loc = useLocation(); return token ? children : <Navigate to="/login" state={{ from: loc.pathname }} replace /> }
export const Skeletons = ({ n = 8 }) => <div className="grid">{Array.from({ length: n }, (_, i) => <div key={i} className="skel" />)}</div>
export const Empty = ({ text, to = '/products', cta = 'Browse products' }) => <div className="empty"><p>{text}</p><Link className="btn" to={to}>{cta}</Link></div>
export const Money = ({ v }) => <>{Number(v).toLocaleString('en-EG')} EGP</>

export function ProductCard({ p }) {
  const { addToCart, toggleWish, wishlist, token, busy } = useApp()
  const liked = wishlist.includes(p._id), gate = fn => token ? fn() : location.assign('/login')
  return (
    <article className="card">
      <button className={'heart' + (liked ? ' on' : '')} aria-label="Toggle wishlist" aria-pressed={liked} onClick={() => gate(() => toggleWish(p._id))}>{liked ? '♥' : '♡'}</button>
      <Link to={`/products/${p._id}`}><img src={p.imageCover} alt={p.title} loading="lazy" /></Link>
      <small>{p.category?.name}</small>
      <h3 title={p.title}>{p.title.split(' ').slice(0, 3).join(' ')}</h3>
      <div className="row"><b><Money v={p.priceAfterDiscount || p.price} /></b><span>★ {p.ratingsAverage}</span></div>
      <button className="btn full" disabled={busy} onClick={() => gate(() => addToCart(p._id))}>Add to cart</button>
    </article>
  )
}

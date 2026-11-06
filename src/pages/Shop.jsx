import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api'
import { useApp } from '../context/AppContext'
import { Empty, Money, ProductCard, Skeletons } from '../components/ui'

export function Cart() {
  const { cart, setQty, removeItem, clearCart, busy } = useApp()
  if (!cart.items.length) return <div className="wrap"><Empty text="Your cart is empty." /></div>
  return <section className="wrap"><h1>Cart ({cart.count})</h1><div className="split"><div>
    {cart.items.map(({ product: p, count, price }) => <div className="line" key={p._id}><img src={p.imageCover} alt="" />
      <div><Link to={`/products/${p._id}`}>{p.title}</Link><p><Money v={price} /></p><button className="link" onClick={() => removeItem(p._id)}>Remove</button></div>
      <div className="qty"><button disabled={busy} onClick={() => setQty(p._id, count - 1)} aria-label="Decrease">−</button>
        <input type="number" min="1" key={count} defaultValue={count} aria-label="Quantity" onBlur={e => +e.target.value !== count && setQty(p._id, +e.target.value)} onKeyDown={e => e.key === 'Enter' && e.target.blur()} />
        <button disabled={busy} onClick={() => setQty(p._id, count + 1)} aria-label="Increase">+</button></div></div>)}
    <p><button className="btn ghost" onClick={clearCart}>Clear cart</button></p></div>
    <aside className="sum"><h3>Order summary</h3><p className="row"><span>Total</span><b><Money v={cart.total} /></b></p><Link className="btn full" to="/checkout">Proceed to checkout</Link></aside></div></section>
}

export function Wishlist() {
  const { wishlist } = useApp(), [items, setItems] = useState(null)
  useEffect(() => { api.get('/wishlist').then(r => setItems(r.data.data)).catch(e => { toast.error(e.userMessage); setItems([]) }) }, [wishlist.length])
  if (!items) return <div className="wrap"><Skeletons n={4} /></div>
  return <section className="wrap"><h1>Wishlist</h1>{items.length ? <div className="grid">{items.map(p => <ProductCard key={p._id} p={p} />)}</div> : <Empty text="Nothing saved yet." />}</section>
}

export function Checkout() {
  const { cart, sync } = useApp(), nav = useNavigate(), [pay, setPay] = useState('cash'), [busy, setBusy] = useState(false)
  const [f, setF] = useState({ details: '', phone: '', city: '' })
  if (!cart.id) return <div className="wrap"><Empty text="Add items before checking out." /></div>
  const submit = async e => {
    e.preventDefault()
    if (f.details.trim().length < 5 || !/^01[0125][0-9]{8}$/.test(f.phone) || !f.city.trim()) return toast.error('Enter a full address, a valid phone and a city')
    setBusy(true)
    try {
      if (pay === 'cash') { await api.post(`/orders/${cart.id}`, { shippingAddress: f }); await sync(); toast.success('Order placed'); nav('/orders') }
      else { const { data } = await api.post(`/orders/checkout-session/${cart.id}?url=${encodeURIComponent(location.origin)}`, { shippingAddress: f }); location.assign(data.session.url) }
    } catch (x) { toast.error(x.userMessage) } finally { setBusy(false) }
  }
  const b = k => ({ value: f[k], onChange: e => setF({ ...f, [k]: e.target.value }) })
  return <section className="wrap auth"><h1>Checkout</h1><form onSubmit={submit}>
    <label className="field">Address<input {...b('details')} /></label><label className="field">Phone<input type="tel" {...b('phone')} /></label><label className="field">City<input {...b('city')} /></label>
    <fieldset><label><input type="radio" checked={pay === 'cash'} onChange={() => setPay('cash')} /> Cash on delivery</label><label><input type="radio" checked={pay === 'card'} onChange={() => setPay('card')} /> Pay online by card</label></fieldset>
    <button className="btn full" disabled={busy}>{busy ? 'Processing…' : pay === 'cash' ? 'Place order' : 'Continue to payment'}</button></form></section>
}

export function Orders() {
  const { user } = useApp(), [orders, setO] = useState(null)
  useEffect(() => { api.get(`/orders/user/${user.id}`).then(r => setO(Array.isArray(r.data) ? r.data : r.data.data || [])).catch(e => { toast.error(e.userMessage); setO([]) }) }, [user.id])
  if (!orders) return <div className="wrap"><Skeletons n={3} /></div>
  if (!orders.length) return <div className="wrap"><Empty text="No orders yet." /></div>
  return <section className="wrap"><h1>Your orders</h1>{[...orders].reverse().map(o => <div className="order" key={o._id}>
    <div className="row"><b>#{o.id}</b><span>{new Date(o.createdAt).toLocaleDateString()}</span><span className={'tag ' + (o.isDelivered ? 'ok' : '')}>{o.isDelivered ? 'Delivered' : 'Processing'}</span><span className="tag">{o.isPaid ? 'Paid' : 'Unpaid'} ({o.paymentMethodType})</span><b><Money v={o.totalOrderPrice} /></b></div>
    <div className="thumbs">{o.cartItems.map(i => <img key={i._id} src={i.product.imageCover} alt={i.product.title} title={`${i.product.title} × ${i.count}`} />)}</div></div>)}</section>
}
